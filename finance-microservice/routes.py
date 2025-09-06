from fastapi import APIRouter, Query
from models import CryptoCurrency, MarketIndices, MarketNews, StockResponse, TopMover
from services import (
    get_crypto_prices,
    get_market_indices,
    get_market_news,
    get_sector_performance,
    get_stock_data,
    get_top_movers_data,
    get_trending_stocks,
)

router = APIRouter()


@router.get("/api/stocks/{symbol}", response_model=StockResponse)
async def get_stock(symbol: str):
    return get_stock_data(symbol)


@router.get("/api/top-movers", response_model=list[TopMover])
async def get_top_movers():
    """Get top stock movers (gainers and losers) for the day"""
    return get_top_movers_data()


@router.get("/api/news", response_model=list[MarketNews])
async def get_news(symbol: str = None, limit: int = Query(10, le=50)):
    """Get market news, optionally for a specific symbol"""
    return get_market_news(symbol, limit)


@router.get("/api/crypto", response_model=list[CryptoCurrency])
async def get_crypto(symbols: str = Query("BTC-USD,ETH-USD,ADA-USD")):
    """Get cryptocurrency prices"""
    symbol_list = [s.strip() for s in symbols.split(",")]
    return get_crypto_prices(symbol_list)


@router.get("/api/indices", response_model=MarketIndices)
async def get_indices():
    """Get major market indices (S&P 500, Dow, Nasdaq)"""
    return get_market_indices()


@router.get("/api/sectors")
async def get_sectors():
    """Get sector performance"""
    return get_sector_performance()


@router.get("/api/trending")
async def get_trending():
    """Get trending/most active stocks"""
    return get_trending_stocks()
