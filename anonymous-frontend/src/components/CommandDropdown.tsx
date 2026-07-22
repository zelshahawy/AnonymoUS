'use client';

import { useEffect, useRef } from 'react';

interface Command {
	command: string;
	description: string;
}

interface CommandDropdownProps {
	isOpen: boolean;
	commands: Command[];
	onSelect: (command: string) => void;
	onClose: () => void;
	selectedIndex: number;
}

export const COMMANDS: Command[] = [
	{
		command: '/stocks ',
		description: 'Get stock price and data (e.g., /stocks AAPL)',
	},
	{
		command: '/top-movers',
		description: 'View today\'s biggest gainers and losers',
	},
	{
		command: '/crypto',
		description: 'View cryptocurrency prices',
	},
	{
		command: '/indices',
		description: 'View major market indices (S&P 500, Dow, Nasdaq)',
	},
	{
		command: '/trending',
		description: 'View most active stocks',
	},
	{
		command: '/news',
		description: "View the latest news"
	},
	{
		command: '/chart ',
		description: 'View price chart (e.g., /chart AAPL or /chart AAPL 6mo)',
	}
];

export default function CommandDropdown({ isOpen, commands, onSelect, onClose, selectedIndex }: CommandDropdownProps) {
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen, onClose]);

	if (!isOpen || commands.length === 0) return null;

	return (
		<div
			ref={dropdownRef}
			className="absolute bottom-full left-0 right-0 mb-2 bg-[#21222c] border border-[#33354a] rounded-xl shadow-xl overflow-hidden z-50"
		>
			<div className="px-4 py-2 text-[11px] uppercase tracking-wide text-[#6b6f80] border-b border-[#33354a]">
				Commands
			</div>
			{commands.map((cmd, index) => {
				const isSelected = index === selectedIndex;
				return (
					<div
						key={cmd.command}
						onClick={() => onSelect(cmd.command)}
						className={`px-4 py-2.5 cursor-pointer transition-colors flex items-center gap-3 ${isSelected ? 'bg-[#bd93f9]/15' : 'hover:bg-[#2a2c39]'
							}`}
					>
						<div className="flex-1 min-w-0">
							<div className="font-mono text-sm text-[#bd93f9]">{cmd.command.trim()}</div>
							<div className="text-xs text-[#6b6f80] truncate">{cmd.description}</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}
