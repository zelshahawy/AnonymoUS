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
