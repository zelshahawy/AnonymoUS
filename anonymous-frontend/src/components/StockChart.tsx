'use client';

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

export default function StockChart({ data }: { data: ChartData }) {
	const { symbol, period, points } = data;
	if (!points || points.length === 0) return null;

	const closes = points.map(p => p.close);
	const min = Math.min(...closes);
	const max = Math.max(...closes);
	const range = max - min || 1;

	const w = 280;
	const h = 120;
	const padTop = 8;
	const padBot = 20;
	const padLeft = 0;
	const padRight = 0;
	const chartH = h - padTop - padBot;
	const chartW = w - padLeft - padRight;

	const polyPoints = points
		.map((p, i) => {
			const x = padLeft + (i / (points.length - 1)) * chartW;
			const y = padTop + chartH - ((p.close - min) / range) * chartH;
			return `${x},${y}`;
		})
		.join(' ');

	const first = closes[0];
	const last = closes[closes.length - 1];
	const change = ((last - first) / first) * 100;
	const isUp = change >= 0;
	const color = isUp ? '#50fa7b' : '#ff5555';

	// Fill area under the line
	const firstX = padLeft;
	const lastX = padLeft + chartW;
	const bottomY = padTop + chartH;
	const areaPoints = `${firstX},${bottomY} ${polyPoints} ${lastX},${bottomY}`;

	return (
		<div>
			<div className="flex items-baseline gap-2 mb-1">
				<span className="font-bold text-[#f8f8f2] text-sm">{symbol}</span>
				<span className="text-xs text-[#6272a4]">{period}</span>
				<span className="text-xs font-mono" style={{ color }}>
					{isUp ? '+' : ''}{change.toFixed(2)}%
				</span>
			</div>
			<svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="block">
				{/* Grid lines */}
				{[0, 0.25, 0.5, 0.75, 1].map(frac => {
					const y = padTop + chartH * (1 - frac);
					return (
						<line key={frac} x1={padLeft} x2={padLeft + chartW} y1={y} y2={y}
							stroke="#6272a4" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.3" />
					);
				})}

				{/* Fill */}
				<polygon points={areaPoints} fill={color} opacity="0.1" />

				{/* Line */}
				<polyline
					points={polyPoints}
					fill="none"
					stroke={color}
					strokeWidth="1.5"
					strokeLinejoin="round"
				/>

				{/* Price labels */}
				<text x={padLeft + 2} y={padTop + 4} fill="#6272a4" fontSize="8" fontFamily="monospace">
					${max.toFixed(2)}
				</text>
				<text x={padLeft + 2} y={padTop + chartH - 2} fill="#6272a4" fontSize="8" fontFamily="monospace">
					${min.toFixed(2)}
				</text>

				{/* Date labels */}
				<text x={padLeft} y={h - 4} fill="#6272a4" fontSize="7" fontFamily="monospace">
					{points[0].date}
				</text>
				<text x={padLeft + chartW} y={h - 4} fill="#6272a4" fontSize="7" fontFamily="monospace" textAnchor="end">
					{points[points.length - 1].date}
				</text>
			</svg>
		</div>
	);
}
