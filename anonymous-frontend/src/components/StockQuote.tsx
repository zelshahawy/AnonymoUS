import type { StockQuoteData } from '@/lib/stockQuote';

const priceFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
});

export default function StockQuote({ data }: { data: StockQuoteData }) {
	const { symbol, price, change, ema20 } = data;
	const roundedChange = Number(change.toFixed(2));
	const direction = roundedChange > 0 ? 'up' : roundedChange < 0 ? 'down' : 'flat';
	const changeStyle = direction === 'up'
		? 'bg-[#50fa7b]/10 text-[#8be9a8]'
		: direction === 'down'
			? 'bg-[#ff5555]/10 text-[#ff9292]'
			: 'bg-[#8b8fa3]/10 text-[#b3b7c8]';

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
							{priceFormatter.format(price)}
						</dd>
					</dl>
					<dl className="flex shrink-0 flex-col items-end gap-1">
						<dt className="order-2 text-[10px] text-[#9b9fb2]">vs. open</dt>
						<dd className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium leading-none tabular-nums ${changeStyle}`}>
							<span aria-hidden="true">{direction === 'up' ? '↗' : direction === 'down' ? '↘' : '→'}</span>
							{direction === 'up' ? '+' : ''}{roundedChange.toFixed(2)}%
						</dd>
					</dl>
				</div>
				<dl className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-[#33354a] pt-3 text-xs">
					<dt className="text-[#9b9fb2]" title="20-day exponential moving average">20-day EMA</dt>
					<dd className="min-w-0 break-all font-medium tabular-nums text-[#d4d7e2]">{priceFormatter.format(ema20)}</dd>
				</dl>
			</div>
		</section>
	);
}
