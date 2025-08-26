import yfinance as yf
from fastapi import HTTPException
from models import StockResponse, TopMover


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
