export interface MarketQuote {
	symbol: string;
	price: number;
	change: number;
}

export interface MarketArticle {
	title: string;
	source?: string;
	url?: string;
}

export type MarketListKind = 'indices' | 'crypto' | 'trending' | 'top-movers';
export type MarketResponse =
	| { kind: MarketListKind; items: MarketQuote[] }
	| { kind: 'news'; symbol?: string; articles: MarketArticle[] };

const MARKET_DATA_PREFIX = 'MARKET_DATA:';
const isRecord = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === 'object' && !Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value);

export function isMarketData(body: string): boolean {
	return body.startsWith(MARKET_DATA_PREFIX);
}

export function safeArticleUrl(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	try {
		const url = new URL(value);
		return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
	} catch {
		return undefined;
	}
}

function parseStructuredResponse(data: unknown): MarketResponse | null {
	if (!isRecord(data)) return null;
	if (data.kind === 'news') {
		if (!Array.isArray(data.articles) || (data.symbol !== undefined && typeof data.symbol !== 'string')) return null;
		const articles: MarketArticle[] = [];
		for (const article of data.articles) {
			if (!isRecord(article) || typeof article.title !== 'string' || !article.title.trim()) return null;
			articles.push({
				title: article.title.trim(),
				source: typeof article.source === 'string' ? article.source.trim() : undefined,
				url: safeArticleUrl(article.url),
			});
		}
		return { kind: 'news', symbol: data.symbol?.trim(), articles };
	}
	if (data.kind !== 'indices' && data.kind !== 'crypto' && data.kind !== 'trending' && data.kind !== 'top-movers') return null;
	if (!Array.isArray(data.items)) return null;
	const items: MarketQuote[] = [];
	for (const item of data.items) {
		if (!isRecord(item) || typeof item.symbol !== 'string' || !item.symbol.trim() ||
			!isFiniteNumber(item.price) || !isFiniteNumber(item.change)) return null;
		items.push({ symbol: item.symbol.trim(), price: item.price, change: item.change });
	}
	return { kind: data.kind, items };
}

// Recognize the previous bot formats so saved messages and older servers get the same presentation.
function parseLegacyResponse(body: string): MarketResponse | null {
	const [heading, ...lines] = body.trim().split('\n');
	const news = heading.match(/^📰 \*\*(.+) News:\*\*$/);
	if (news) {
		const articles: MarketArticle[] = [];
		for (const line of lines.filter(line => line.trim())) {
			if (!line.startsWith('• ') || !line.slice(2).trim()) return null;
			articles.push({ title: line.slice(2).trim() });
		}
		return { kind: 'news', symbol: news[1] === 'Market' ? undefined : news[1], articles };
	}
	const headings: Record<string, MarketListKind> = {
		'📊 **Market Indices:**': 'indices',
		'₿ **Crypto Prices:**': 'crypto',
		'🔥 **Trending Stocks:**': 'trending',
		'📊 **Top Movers Today**': 'top-movers',
	};
	const kind = headings[heading];
	if (!kind) return null;
	const items: MarketQuote[] = [];
	for (const line of lines.filter(line => line.trim())) {
		if (kind === 'top-movers' && ['🟢 **Top Gainers:**', '🔴 **Top Losers:**'].includes(line)) continue;
		const match = line.match(/^(?:[🟢🔴] )?\*\*(.+)\*\* \$(-?\d+(?:\.\d+)?) \(([+-]?\d+(?:\.\d+)?)%\)$/u);
		if (!match) return null;
		const [, symbol, price, change] = match;
		items.push({ symbol, price: Number(price), change: Number(change) });
	}
	return parseStructuredResponse({ kind, items });
}

export function parseMarketResponse(body: string): MarketResponse | null {
	if (!isMarketData(body)) return parseLegacyResponse(body);
	try {
		return parseStructuredResponse(JSON.parse(body.slice(MARKET_DATA_PREFIX.length)));
	} catch {
		return null;
	}
}
