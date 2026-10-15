import MarketChangeBadge from '@/components/MarketChangeBadge';
import { formatMarketNumber, formatMarketPrice } from '@/lib/marketFormat';
import type { MarketListKind, MarketQuote, MarketResponse } from '@/lib/marketResponse';

const listLabels: Record<MarketListKind, { title: string; subtitle: string; unit: string }> = {
	indices: { title: 'Market indices', subtitle: 'U.S. benchmarks', unit: 'Points · change vs. previous close' },
	crypto: { title: 'Crypto', subtitle: 'Cryptocurrency prices', unit: 'USD · change vs. open' },
	trending: { title: 'Trending stocks', subtitle: 'Most active by volume', unit: 'USD · change vs. open' },
	'top-movers': { title: 'Top movers', subtitle: 'Gainers & losers', unit: 'USD · change vs. previous close' },
};

function QuoteRows({ items, indices = false }: { items: MarketQuote[]; indices?: boolean }) {
	return (
		<ul className="divide-y divide-[#33354a]/70">
			{items.map((item, index) => (
				<li key={`${item.symbol}-${index}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-3">
					<div className="min-w-0 flex-1 basis-24">
						<div className="break-words text-sm font-medium leading-snug text-[#f8f8f2]">{item.symbol}</div>
						<div className="mt-1 break-all text-xs leading-snug tabular-nums text-[#b3b7c8]">
							{indices ? formatMarketNumber(item.price) : formatMarketPrice(item.price)}
						</div>
					</div>
					<MarketChangeBadge change={item.change} />
				</li>
			))}
		</ul>
	);
}

export default function MarketCard({ data }: { data: MarketResponse }) {
	const title = data.kind === 'news' ? (data.symbol ? `${data.symbol} news` : 'Market news') : listLabels[data.kind].title;
	const subtitle = data.kind === 'news' ? 'Latest headlines' : listLabels[data.kind].subtitle;

	return (
		<section aria-label={title} className="w-[300px] max-w-full text-[#f8f8f2]">
			<header className="border-b border-[#33354a] pb-3">
				<h3 className="break-words text-sm font-semibold text-[#bd93f9]">{title}</h3>
				<p className="mt-0.5 text-[11px] leading-relaxed text-[#9b9fb2]">{subtitle}</p>
			</header>
			{data.kind === 'news' ? (
				data.articles.length ? (
					<ul className="divide-y divide-[#33354a]/70">
						{data.articles.map((article, index) => (
							<li key={`${article.title}-${index}`} className="py-3 last:pb-0">
								{article.source && <p className="mb-1 break-words text-[10px] font-medium text-[#9b9fb2]">{article.source}</p>}
								{article.url ? (
									<a href={article.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2 rounded-sm text-[13px] leading-relaxed hover:text-[#bd93f9] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#bd93f9]">
										<span className="min-w-0 flex-1 break-words">{article.title}</span>
										<span aria-hidden="true" className="shrink-0 text-[#9b9fb2] group-hover:text-[#bd93f9]">↗</span>
										<span className="sr-only"> (opens in a new tab)</span>
									</a>
								) : <p className="break-words text-[13px] leading-relaxed">{article.title}</p>}
							</li>
						))}
					</ul>
				) : <p className="pt-3 text-xs text-[#9b9fb2]">No headlines available right now.</p>
			) : (
				<>
					{data.items.length === 0 ? (
						<p className="py-3 text-xs text-[#9b9fb2]">No market data available right now.</p>
					) : data.kind === 'top-movers' ? (
						<div className="divide-y divide-[#33354a]">
							{[
								{ label: 'Gainers', items: data.items.filter(item => item.change > 0).slice(0, 5) },
								{ label: 'Losers', items: data.items.filter(item => item.change < 0).slice(0, 5) },
								{ label: 'Unchanged', items: data.items.filter(item => item.change === 0).slice(0, 5) },
							].filter(group => group.label !== 'Unchanged' || group.items.length).map(group => (
								<div key={group.label} className="pt-3">
									<h4 className="text-[10px] font-medium uppercase tracking-widest text-[#9b9fb2]">{group.label}</h4>
									{group.items.length ? <QuoteRows items={group.items} /> : <p className="py-3 text-xs text-[#9b9fb2]">No {group.label.toLowerCase()} available.</p>}
								</div>
							))}
						</div>
					) : <QuoteRows items={data.items} indices={data.kind === 'indices'} />}
					<p className="border-t border-[#33354a] pt-3 text-[10px] leading-relaxed text-[#9b9fb2]">{listLabels[data.kind].unit}</p>
				</>
			)}
		</section>
	);
}
