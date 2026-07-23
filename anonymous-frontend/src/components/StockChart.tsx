'use client';

import { useId } from 'react';

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
		return JSON.parse(body.slice('CHART_DATA:'.length));
	} catch {
		return null;
	}
}

const fmtPrice = (n: number) =>
	n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function StockChart({ data }: { data: ChartData }) {
	const gradientId = useId();
	const { symbol, period, points } = data;
	if (!points || points.length === 0) return null;

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
	const isUp = change >= 0;
	const color = isUp ? '#50fa7b' : '#ff5555';

	const bottomY = padTop + chartH;
	const areaPoints = `${padX},${bottomY} ${polyPoints} ${padX + chartW},${bottomY}`;
	const lastPt = coords[coords.length - 1];

	return (
		<div className="w-[300px] max-w-full">
			<div className="flex items-start justify-between mb-2 gap-3">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<span className="font-bold text-[#f8f8f2] text-sm tracking-tight">{symbol}</span>
						<span className="text-[10px] uppercase tracking-wide text-[#8b8fa3] bg-[#2a2c39] rounded px-1.5 py-0.5">
							{period}
						</span>
					</div>
					<div className="text-[10px] text-[#6b6f80] font-mono mt-0.5">
						H ${fmtPrice(max)} · L ${fmtPrice(min)}
					</div>
				</div>
				<div className="text-right leading-tight shrink-0">
					<div className="font-bold text-[#f8f8f2] text-sm">${fmtPrice(last)}</div>
					<div className="text-xs font-mono" style={{ color }}>
						{isUp ? '▲' : '▼'} {isUp ? '+' : ''}{change.toFixed(2)}%
					</div>
				</div>
			</div>

			<svg viewBox={`0 0 ${w} ${h}`} width="100%" className="block">
				<defs>
					<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={color} stopOpacity="0.3" />
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

			<div className="flex justify-between text-[10px] text-[#6b6f80] font-mono mt-1">
				<span>{points[0].date}</span>
				<span>{points[points.length - 1].date}</span>
			</div>
		</div>
	);
}
