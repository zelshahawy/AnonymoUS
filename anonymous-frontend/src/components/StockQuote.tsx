import MarketChangeBadge from '@/components/MarketChangeBadge';
import { formatMarketPrice } from '@/lib/marketFormat';
import type { StockQuoteData } from '@/lib/stockQuote';

export default function StockQuote({ data }: { data: StockQuoteData }) {
	const { symbol, price, change, ema20 } = data;

	return (
		<section aria-label={`${symbol} stock quote`} className="w-[280px] max-w-full text-[#f8f8f2]">
			<div className="flex items-center justify-between gap-3">
				<span className="min-w-0 break-all text-sm font-semibold tracking-wide text-[#bd93f9]">{symbol}</span>
				<span className="shrink-0 text-[10px] uppercase tracking-widest text-[#9b9fb2]">Stock quote</span>
			</div>
			<div className="mt-3">
				<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
					<dl className="min-w-0">
						<dt className="sr-only">Price in US dollars</dt>
						<dd className="break-all text-[28px] font-semibold leading-tight tracking-tight tabular-nums">
							{formatMarketPrice(price)}
						</dd>
					</dl>
					<dl className="flex shrink-0 flex-col items-end gap-1">
						<dt className="order-2 text-[10px] text-[#9b9fb2]">vs. open</dt>
						<dd className="flex"><MarketChangeBadge change={change} /></dd>
					</dl>
				</div>
				<dl className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[#33354a] pt-3 text-xs">
					<dt className="text-[#9b9fb2]" title="20-day exponential moving average">20-day EMA</dt>
					<dd className="min-w-0 break-all font-medium tabular-nums text-[#d4d7e2]">{formatMarketPrice(ema20)}</dd>
				</dl>
			</div>
		</section>
	);
}
