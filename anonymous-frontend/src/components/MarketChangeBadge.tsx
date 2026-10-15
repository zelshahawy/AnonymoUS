export default function MarketChangeBadge({ change }: { change: number }) {
	const roundedChange = Number(change.toFixed(2));
	const direction = roundedChange > 0 ? 'up' : roundedChange < 0 ? 'down' : 'flat';
	const changeStyle = direction === 'up'
		? 'bg-[#50fa7b]/10 text-[#8be9a8]'
		: direction === 'down'
			? 'bg-[#ff5555]/10 text-[#ff9292]'
			: 'bg-[#8b8fa3]/10 text-[#b3b7c8]';

	return (
		<span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium leading-none tabular-nums ${changeStyle}`}>
			<span aria-hidden="true">{direction === 'up' ? '↗' : direction === 'down' ? '↘' : '→'}</span>
			{direction === 'up' ? '+' : ''}{roundedChange.toFixed(2)}%
		</span>
	);
}
