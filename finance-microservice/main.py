import yfinance as yf
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


class StockResponse(BaseModel):
    symbol: str
    price: float
    change: float
    ema20: float


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5005)
