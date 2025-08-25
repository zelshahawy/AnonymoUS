import yfinance as yf
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


class StockResponse(BaseModel):
    symbol: str
    price: float
    change: float
    ema20: float


class TopMover(BaseModel):
    symbol: str
    price: float
    change: float


app = FastAPI()


@app.get("/api/stocks/{symbol}", response_model=StockResponse)
async def get_stock(symbol: str):
    ticker = yf.Ticker(symbol)
    data = ticker.history(period="1d")
    if data.empty:
        raise HTTPException(404, "symbol not found")
    last = data.iloc[-1]
    return {
        "symbol": symbol.upper(),
        "price": round(last["Close"], 2),
        "change": round((last["Close"] - last["Open"]) / last["Open"] * 100, 2),
        "ema20": round(
            ticker.history(period="20d")["Close"].ewm(span=20).mean().iloc[-1], 2
        ),
    }


@app.get("/api/top-movers", response_model=list[TopMover])
async def get_top_movers():
    """Get top stock movers (gainers and losers) for the day"""
    try:
        gainers_result = yf.screen("day_gainers")
        losers_result = yf.screen("day_losers")

        top_movers = []

        if "quotes" in gainers_result:
            for quote in gainers_result["quotes"][:10]:
                top_movers.append(
                    {
                        "symbol": quote.get("symbol", ""),
                        "price": round(quote.get("regularMarketPrice", 0), 2),
                        "change": round(quote.get("regularMarketChangePercent", 0), 2),
                    }
                )

        if "quotes" in losers_result:
            for quote in losers_result["quotes"][:10]:
                top_movers.append(
                    {
                        "symbol": quote.get("symbol", ""),
                        "price": round(quote.get("regularMarketPrice", 0), 2),
                        "change": round(quote.get("regularMarketChangePercent", 0), 2),
                    }
                )

        return top_movers

    except Exception as e:
        raise HTTPException(500, f"Error fetching top movers: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5005)
