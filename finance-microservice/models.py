from datetime import datetime
from typing import Optional

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


class MarketNews(BaseModel):
    title: str
    summary: str
    url: str
    source: str
    timestamp: datetime


class CryptoCurrency(BaseModel):
    symbol: str
    price: float
    change: float
    volume: int


class MarketIndices(BaseModel):
    s_p_500: Optional[dict] = None
    dow_jones: Optional[dict] = None
    nasdaq: Optional[dict] = None


class StockAlert(BaseModel):
    symbol: str
    price: float
    alert_type: str  # "above" or "below"
    target_price: float
    created_at: datetime
