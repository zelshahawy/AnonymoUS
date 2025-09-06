from datetime import datetime

import yfinance as yf
from fastapi import HTTPException
from models import CryptoCurrency, MarketIndices, MarketNews, StockResponse, TopMover


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


def get_market_news(symbol: str = None, limit: int = 10) -> list[MarketNews]:
    """Get latest market news and financial headlines"""
    try:
        news_data = []

        if symbol:
            ticker = yf.Ticker(symbol.upper())
            news = ticker.news

            for article in news[:limit]:
                news_data.append(
                    MarketNews(
                        title=article.get("title", ""),
                        summary=article.get("summary", ""),
                        url=article.get("link", ""),
                        source=article.get("publisher", ""),
                        timestamp=datetime.fromtimestamp(
                            article.get("providerPublishTime", 0)
                        ),
                    )
                )
        else:
            # Get general market news from major tickers
            tickers = ["SPY", "AAPL", "TSLA", "NVDA", "MSFT"]

            for ticker_symbol in tickers[:3]:  # Limit to avoid rate limits
                ticker = yf.Ticker(ticker_symbol)
                news = ticker.news

                for article in news[:2]:  # 2 articles per ticker
                    news_data.append(
                        MarketNews(
                            title=article.get("title", ""),
                            summary=article.get("summary", ""),
                            url=article.get("link", ""),
                            source=article.get("publisher", ""),
                            timestamp=datetime.fromtimestamp(
                                article.get("providerPublishTime", 0)
                            ),
                        )
                    )

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
    """Get major market indices (S&P 500, Dow, Nasdaq)"""
    try:
        indices = {"^GSPC": "S&P 500", "^DJI": "Dow Jones", "^IXIC": "Nasdaq"}

        results = {}

        for symbol, name in indices.items():
            ticker = yf.Ticker(symbol)
            data = ticker.history(period="1d")

            if not data.empty:
                last = data.iloc[-1]
                results[name.lower().replace(" ", "_")] = {
                    "name": name,
                    "value": round(last["Close"], 2),
                    "change": round(
                        (last["Close"] - last["Open"]) / last["Open"] * 100, 2
                    ),
                }

        return MarketIndices(**results)

    except Exception as e:
        raise HTTPException(500, f"Error fetching market indices: {str(e)}")


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

        # Sort by volume (most active)
        trending.sort(key=lambda x: x["volume"], reverse=True)

        return trending

    except Exception as e:
        raise HTTPException(500, f"Error fetching trending stocks: {str(e)}")
