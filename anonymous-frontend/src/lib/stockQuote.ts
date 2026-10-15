export interface StockQuoteData {
	symbol: string;
	price: number;
	change: number;
	ema20: number;
}

const STOCK_DATA_PREFIX = 'STOCK_DATA:';

export function isStockQuoteData(body: string): boolean {
	return body.startsWith(STOCK_DATA_PREFIX);
}

export function parseStockQuote(body: string): StockQuoteData | null {
	if (isStockQuoteData(body)) {
		try {
			const data: unknown = JSON.parse(body.slice(STOCK_DATA_PREFIX.length));
			if (
				!data || typeof data !== 'object' ||
				!('symbol' in data) || typeof data.symbol !== 'string' || !data.symbol.trim() ||
				!('price' in data) || typeof data.price !== 'number' || !Number.isFinite(data.price) ||
				!('change' in data) || typeof data.change !== 'number' || !Number.isFinite(data.change) ||
				!('ema20' in data) || typeof data.ema20 !== 'number' || !Number.isFinite(data.ema20)
			) return null;

			return { symbol: data.symbol.trim(), price: data.price, change: data.change, ema20: data.ema20 };
		} catch {
			return null;
		}
	}

	// Keep quotes from older servers and saved conversations readable as cards.
	const legacy = body.match(/^📈\s+(\S+)\s+Price:\s+\$(-?\d+(?:\.\d+)?)\s+Change:\s+([+-]?\d+(?:\.\d+)?)%\s+EMA20:\s+\$(-?\d+(?:\.\d+)?)\s*$/);
	if (!legacy) return null;
	const [, symbol, price, change, ema20] = legacy;
	const quote = { symbol, price: Number(price), change: Number(change), ema20: Number(ema20) };
	return [quote.price, quote.change, quote.ema20].every(Number.isFinite) ? quote : null;
}
