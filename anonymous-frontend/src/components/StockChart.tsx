'use client';

import { useId } from 'react';
import MarketChangeBadge from '@/components/MarketChangeBadge';
import { formatMarketPrice } from '@/lib/marketFormat';

interface ChartData {
	symbol: string;
	period: string;
	points: { date: string; close: number }[];
}

export function isChartData(body: string): boolean {
	return body.startsWith('CHART_DATA:');
}

export function parseChartData(body: string): ChartData | null {
	try {
		const data = JSON.parse(body.slice('CHART_DATA:'.length));
		if (!data || typeof data.symbol !== 'string' || !data.symbol.trim() ||
			typeof data.period !== 'string' || !Array.isArray(data.points) ||
			!data.points.every((point: unknown) => point && typeof point === 'object' &&
				'date' in point && typeof point.date === 'string' &&
				'close' in point && typeof point.close === 'number' && Number.isFinite(point.close))) return null;
		return data;
	} catch {
		return null;
	}
}

export default function StockChart({ data }: { data: ChartData }) {
	const gradientId = useId();
	const { symbol, period, points } = data;
	if (!points || points.length === 0) {
		return (
			<section aria-label={`${symbol} price chart`} className="w-[300px] max-w-full">
				<h3 className="break-words text-sm font-semibold text-[#bd93f9]">{symbol} · {period}</h3>
				<p className="mt-3 text-xs text-[#9b9fb2]">No price history available right now.</p>
			</section>
		);
	}

	const closes = points.map(p => p.close);
	const min = Math.min(...closes);
	const max = Math.max(...closes);
	const range = max - min || 1;

	const w = 300;
	const h = 120;
	const padTop = 8;
	const padBot = 8;
	const padX = 6;
	const chartH = h - padTop - padBot;
	const chartW = w - padX * 2;

	const coords = points.map((p, i) => {
		const x = padX + (i / (points.length - 1 || 1)) * chartW;
		const y = padTop + chartH - ((p.close - min) / range) * chartH;
		return { x, y };
	});
	const polyPoints = coords.map(c => `${c.x},${c.y}`).join(' ');

	const first = closes[0];
	const last = closes[closes.length - 1];
	const change = first ? ((last - first) / first) * 100 : 0;
	const color = change > 0 ? '#8be9a8' : change < 0 ? '#ff9292' : '#b3b7c8';

	const bottomY = padTop + chartH;
	const areaPoints = `${padX},${bottomY} ${polyPoints} ${padX + chartW},${bottomY}`;
	const lastPt = coords[coords.length - 1];

	return (
		<section aria-label={`${symbol} price chart`} className="w-[300px] max-w-full text-[#f8f8f2]">
			<div className="flex items-center justify-between gap-3">
				<span className="min-w-0 break-all text-sm font-semibold tracking-wide text-[#bd93f9]">{symbol}</span>
				<span className="shrink-0 text-[10px] uppercase tracking-widest text-[#9b9fb2]">Price history</span>
			</div>
			<div className="my-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
				<div className="min-w-0 break-all text-[28px] font-semibold leading-tight tracking-tight tabular-nums">
					<span className="sr-only">Latest price: </span>{formatMarketPrice(last)}
				</div>
				<div className="flex flex-col items-end gap-1">
					<MarketChangeBadge change={change} />
					<span className="text-[10px] text-[#9b9fb2]">over {period}</span>
				</div>
			</div>

			<svg role="img" aria-label={`${symbol} closing prices over ${period}`} viewBox={`0 0 ${w} ${h}`} width="100%" className="block">
				<defs>
					<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={color} stopOpacity="0.18" />
						<stop offset="100%" stopColor={color} stopOpacity="0" />
					</linearGradient>
				</defs>

				{/* Baseline gridlines */}
				{[0, 0.5, 1].map(frac => {
					const y = padTop + chartH * frac;
					return (
						<line
							key={frac}
							x1={padX}
							x2={padX + chartW}
							y1={y}
							y2={y}
							stroke="#33354a"
							strokeWidth="1"
							strokeDasharray="2,4"
						/>
					);
				})}

				<polygon points={areaPoints} fill={`url(#${gradientId})`} />

				<polyline
					points={polyPoints}
					fill="none"
					stroke={color}
					strokeWidth="2"
					strokeLinejoin="round"
					strokeLinecap="round"
				/>

				{/* Latest-price marker */}
				<circle cx={lastPt.x} cy={lastPt.y} r="3.5" fill={color} stroke="#21222c" strokeWidth="2" />
			</svg>

			<div className="mt-1 flex justify-between gap-3 text-[10px] text-[#9b9fb2]">
				<span className="min-w-0 break-words">{points[0].date}</span>
				<span className="min-w-0 break-words text-right">{points[points.length - 1].date}</span>
			</div>
			<dl className="mt-3 grid grid-cols-2 gap-3 border-t border-[#33354a] pt-3 text-xs">
				<div className="min-w-0">
					<dt className="text-[10px] text-[#9b9fb2]">Period low</dt>
					<dd className="mt-0.5 break-all tabular-nums text-[#d4d7e2]">{formatMarketPrice(min)}</dd>
				</div>
				<div className="min-w-0 text-right">
					<dt className="text-[10px] text-[#9b9fb2]">Period high</dt>
					<dd className="mt-0.5 break-all tabular-nums text-[#d4d7e2]">{formatMarketPrice(max)}</dd>
				</div>
			</dl>
		</section>
	);
}
