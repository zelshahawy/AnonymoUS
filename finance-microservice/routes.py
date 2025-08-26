from fastapi import APIRouter
from models import StockResponse, TopMover
from services import get_stock_data, get_top_movers_data

router = APIRouter()


@router.get("/api/stocks/{symbol}", response_model=StockResponse)
async def get_stock(symbol: str):
    return get_stock_data(symbol)


@router.get("/api/top-movers", response_model=list[TopMover])
async def get_top_movers():
    """Get top stock movers (gainers and losers) for the day"""
    return get_top_movers_data()
