'use client';

import { useEffect, useRef } from 'react';

interface Command {
	command: string;
	description: string;
	icon: string;
}

interface CommandDropdownProps {
	isOpen: boolean;
	onSelect: (command: string) => void;
	onClose: () => void;
	inputRef: React.RefObject<HTMLInputElement | null>;
}

const COMMANDS: Command[] = [
	{
		command: '/stocks ',
		description: 'Get stock price and data (e.g., /stocks AAPL)',
		icon: '📈'
	},
	{
		command: '/top-movers',
		description: 'View today\'s biggest gainers and losers',
		icon: '📊'
	}
];

export default function CommandDropdown({ isOpen, onSelect, onClose, inputRef }: CommandDropdownProps) {
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

	if (!isOpen) return null;

	return (
		<div
			ref={dropdownRef}
			className="absolute bottom-full left-0 right-0 mb-2 bg-[#44475a] border-2 border-[#bd93f9] rounded-lg shadow-lg overflow-hidden z-50"
		>
			<div className="px-3 py-2 text-xs text-[#6272a4] bg-[#282a36] border-b border-[#6272a4]">
				Bot Commands
			</div>
			{COMMANDS.map((cmd, index) => (
				<div
					key={index}
					onClick={() => onSelect(cmd.command)}
					className="px-4 py-3 hover:bg-[#bd93f9] hover:text-[#282a36] text-[#f8f8f2] cursor-pointer transition-colors flex items-center gap-3"
				>
					<span className="text-lg">{cmd.icon}</span>
					<div className="flex-1">
						<div className="font-medium text-sm">{cmd.command}</div>
						<div className="text-xs opacity-75">{cmd.description}</div>
					</div>
				</div>
			))}
		</div>
	);
}
