from datetime import datetime, timezone

import yfinance as yf
from fastapi import HTTPException
from models import ChartPoint, ChartResponse, CryptoCurrency, MarketIndices, MarketNews, StockResponse, TopMover


def _extract_datetime(article: dict, content: dict) -> datetime:
    provider_publish_time = article.get("providerPublishTime")
    if isinstance(provider_publish_time, (int, float)) and provider_publish_time > 0:
        return datetime.fromtimestamp(provider_publish_time, tz=timezone.utc)

    for key in ("pubDate", "displayTime"):
        raw = content.get(key)
        if isinstance(raw, str) and raw:
            try:
                return datetime.fromisoformat(raw.replace("Z", "+00:00"))
            except ValueError:
                continue

    return datetime.now(timezone.utc)


def _extract_url(article: dict, content: dict) -> str:
    legacy_link = article.get("link")
    if isinstance(legacy_link, str) and legacy_link:
        return legacy_link

    clickthrough = content.get("clickThroughUrl")
    if isinstance(clickthrough, dict):
        clickthrough_url = clickthrough.get("url")
        if isinstance(clickthrough_url, str) and clickthrough_url:
            return clickthrough_url

    canonical = content.get("canonicalUrl")
    if isinstance(canonical, dict):
        canonical_url = canonical.get("url")
        if isinstance(canonical_url, str) and canonical_url:
            return canonical_url

    preview_url = content.get("previewUrl")
    if isinstance(preview_url, str):
        return preview_url
    return ""


def _extract_source(article: dict, content: dict) -> str:
    legacy_source = article.get("publisher")
    if isinstance(legacy_source, str) and legacy_source:
        return legacy_source

    provider = content.get("provider")
    if isinstance(provider, dict):
        for key in ("displayName", "name", "sourceId"):
            value = provider.get(key)
            if isinstance(value, str) and value:
                return value
    return ""


def _normalize_news_article(article: dict) -> MarketNews | None:
    content = article.get("content")
    if not isinstance(content, dict):
        content = {}

    title = article.get("title")
    if not isinstance(title, str) or not title:
        title = content.get("title")
    if not isinstance(title, str) or not title:
        return None

    summary = article.get("summary")
    if not isinstance(summary, str) or not summary:
        summary = content.get("summary")
    if not isinstance(summary, str):
        summary = ""

    return MarketNews(
        title=title,
        summary=summary,
        url=_extract_url(article, content),
        source=_extract_source(article, content),
        timestamp=_extract_datetime(article, content),
    )


def get_stock_data(symbol: str) -> StockResponse:
    """Fetch stock data for a given symbol"""
    ticker = yf.Ticker(symbol)
    data = ticker.history(period="1d")
    if data.empty:
        raise HTTPException(404, "symbol not found")

    last = data.iloc[-1]
    return StockResponse(
        symbol=symbol.upper(),
        price=round(last["Close"], 2),
        change=round((last["Close"] - last["Open"]) / last["Open"] * 100, 2),
        ema20=round(
            ticker.history(period="20d")["Close"].ewm(span=20).mean().iloc[-1], 2
        ),
    )


def get_top_movers_data() -> list[TopMover]:
    """Get top stock movers (gainers and losers) for the day"""
    try:
        gainers_result = yf.screen("day_gainers")
        losers_result = yf.screen("day_losers")

        top_movers = []

        if "quotes" in gainers_result:
            for quote in gainers_result["quotes"][:10]:
                top_movers.append(
                    TopMover(
                        symbol=quote.get("symbol", ""),
                        price=round(quote.get("regularMarketPrice", 0), 2),
                        change=round(quote.get("regularMarketChangePercent", 0), 2),
                    )
                )

        if "quotes" in losers_result:
            for quote in losers_result["quotes"][:10]:
                top_movers.append(
                    TopMover(
                        symbol=quote.get("symbol", ""),
                        price=round(quote.get("regularMarketPrice", 0), 2),
                        change=round(quote.get("regularMarketChangePercent", 0), 2),
                    )
                )

        return top_movers

    except Exception as e:
        raise HTTPException(500, f"Error fetching top movers: {str(e)}")


def get_market_news(symbol: str | None = None, limit: int = 10) -> list[MarketNews]:
    """Get latest market news and financial headlines"""
    try:
        news_data: list[MarketNews] = []
        seen_titles: set[str] = set()

        def add_articles(articles: list[dict], max_count: int):
            for article in articles[:max_count]:
                parsed = _normalize_news_article(article)
                if not parsed:
                    continue
                title_key = parsed.title.strip().lower()
                if title_key in seen_titles:
                    continue
                seen_titles.add(title_key)
                news_data.append(parsed)
                if len(news_data) >= limit:
                    break

        if symbol:
            ticker = yf.Ticker(symbol.upper())
            news = ticker.news or []
            add_articles(news, limit)
        else:
            tickers = [
                "SPY",
                "QQQ",
                "DIA",
                "IWM",
                "AAPL",
                "MSFT",
                "NVDA",
                "TSLA",
                "AMZN",
                "GOOGL",
                "META",
                "AMD",
                "JPM",
                "XOM",
            ]

            for ticker_symbol in tickers:
                ticker = yf.Ticker(ticker_symbol)
                news = ticker.news or []
                add_articles(news, 2)
                if len(news_data) >= limit:
                    break

        return news_data[:limit]

    except Exception as e:
        raise HTTPException(500, f"Error fetching market news: {str(e)}")


def get_crypto_prices(
    symbols: list[str] = ["BTC-USD", "ETH-USD", "ADA-USD"],
) -> list[CryptoCurrency]:
    """Get cryptocurrency prices"""
    try:
        crypto_data = []

        for symbol in symbols:
            ticker = yf.Ticker(symbol)
            data = ticker.history(period="1d")

            if not data.empty:
                last = data.iloc[-1]
                crypto_data.append(
                    CryptoCurrency(
                        symbol=symbol.replace("-USD", ""),
                        price=round(last["Close"], 2),
                        change=round(
                            (last["Close"] - last["Open"]) / last["Open"] * 100, 2
                        ),
                        volume=int(last["Volume"]),
                    )
                )

        return crypto_data

    except Exception as e:
        raise HTTPException(500, f"Error fetching crypto prices: {str(e)}")


def get_market_indices() -> MarketIndices:
    """
    Get major U.S. market indices (S&P 500, Dow, Nasdaq Composite).

    Returns a MarketIndices model with fields:
    - sp500, dow_jones, nasdaq
    Each field is a dict: {"name": str, "value": float, "change": float}
    where `change` is % change vs previous close.
    """
    try:
        index_map: dict[str, tuple[str, str]] = {
            "^GSPC": ("sp500", "S&P 500"),
            "^DJI": ("dow_jones", "Dow Jones"),
            "^IXIC": ("nasdaq", "Nasdaq Composite"),
        }

        tickers = list(index_map.keys())

        df = yf.download(
            tickers=tickers,
            period="2d",
            interval="1d",
            group_by="ticker",
            auto_adjust=False,
            threads=True,
            progress=False,
        )

        results: dict[str, dict] = {}

        for symbol, (field, name) in index_map.items():
            try:
                data = df if len(tickers) == 1 else df[symbol]
                if data.empty:
                    continue

                last_two = data.tail(2)
                if len(last_two) == 1:
                    last = last_two.iloc[-1]
                    prev_close = float(last.get("Close", 0.0))
                else:
                    prev = last_two.iloc[0]
                    last = last_two.iloc[1]
                    prev_close = float(prev.get("Close", 0.0))

                close = float(last.get("Close", 0.0))
                if prev_close:
                    pct_change = (close - prev_close) / prev_close * 100.0
                else:
                    pct_change = 0.0

                results[field] = {
                    "name": name,
                    "value": round(close, 2),
                    "change": round(pct_change, 2),
                }
            except Exception:
                continue

        if not results:
            raise RuntimeError("No index data returned.")

        return MarketIndices(**results)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching market indices: {e}"
        )


def get_sector_performance() -> dict:
    """Get sector ETF performance"""
    try:
        sectors = {
            "XLK": "Technology",
            "XLF": "Financials",
            "XLV": "Healthcare",
            "XLE": "Energy",
            "XLI": "Industrials",
            "XLP": "Consumer Staples",
            "XLY": "Consumer Discretionary",
            "XLB": "Materials",
            "XLRE": "Real Estate",
        }

        sector_data = []

        for etf, sector_name in sectors.items():
            ticker = yf.Ticker(etf)
            data = ticker.history(period="1d")

            if not data.empty:
                last = data.iloc[-1]
                sector_data.append(
                    {
                        "sector": sector_name,
                        "etf": etf,
                        "price": round(last["Close"], 2),
                        "change": round(
                            (last["Close"] - last["Open"]) / last["Open"] * 100, 2
                        ),
                    }
                )

        # Sort by performance
        sector_data.sort(key=lambda x: x["change"], reverse=True)

        return {"sectors": sector_data}

    except Exception as e:
        raise HTTPException(500, f"Error fetching sector performance: {str(e)}")


VALID_CHART_PERIODS = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"}


def get_chart_data(symbol: str, period: str = "1mo") -> ChartResponse:
    """Get historical close prices for charting."""
    if period not in VALID_CHART_PERIODS:
        raise HTTPException(400, f"Invalid period. Use one of: {', '.join(sorted(VALID_CHART_PERIODS))}")

    ticker = yf.Ticker(symbol.upper())
    interval = "1h" if period in ("1d", "5d") else "1d"
    data = ticker.history(period=period, interval=interval)

    if data.empty:
        raise HTTPException(404, "Symbol not found")

    points = []
    for idx, row in data.iterrows():
        date_str = idx.strftime("%Y-%m-%d %H:%M") if period in ("1d", "5d") else idx.strftime("%Y-%m-%d")
        points.append(ChartPoint(date=date_str, close=round(float(row["Close"]), 2)))

    return ChartResponse(symbol=symbol.upper(), period=period, points=points)


def get_trending_stocks() -> list[dict]:
    """Get trending/most active stocks"""
    try:
        trending = []
        active_tickers = [
            "AAPL",
            "TSLA",
            "NVDA",
            "MSFT",
            "GOOGL",
            "AMZN",
            "META",
            "NFLX",
            "AMD",
            "INTC",
        ]

        for symbol in active_tickers[:8]:
            ticker = yf.Ticker(symbol)
            data = ticker.history(period="1d")

            if not data.empty:
                last = data.iloc[-1]
                trending.append(
                    {
                        "symbol": symbol,
                        "price": round(last["Close"], 2),
                        "change": round(
                            (last["Close"] - last["Open"]) / last["Open"] * 100, 2
                        ),
                        "volume": int(last["Volume"]),
                    }
                )

        trending.sort(key=lambda x: x["volume"], reverse=True)

        return trending

    except Exception as e:
        raise HTTPException(500, f"Error fetching trending stocks: {str(e)}")
