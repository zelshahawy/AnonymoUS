'use client';
import { mdiAccount, mdiCog, mdiLock, mdiLogout, mdiPencil } from '@mdi/js';
import Icon from '@mdi/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface UserProfileProps {
	user?: string;
}

export default function UserProfile({ user: propUser }: UserProfileProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [user, setUser] = useState<string | undefined>(propUser);
	const [mounted, setMounted] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		// Check localStorage for logged-in user
		const storedUser = typeof window !== 'undefined' ? window.localStorage.getItem('user') : null;
		if (storedUser) {
			setUser(storedUser);
		} else {
			setUser(propUser);
		}
	}, [propUser]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const getInitials = (name: string) => {
		return name.slice(0, 2).toUpperCase();
	};

	// Show loading state while mounting
	if (!mounted) {
		return (
			<div className="relative" ref={dropdownRef}>
				<button
					className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#44475a] text-[#f8f8f2] font-bold border-2 border-[#bd93f9]"
					disabled
				>
					<div className="w-6 h-6 rounded-full bg-[#282a36] flex items-center justify-center">
						<Icon path={mdiAccount} size={0.5} color="#bd93f9" />
					</div>
					<span className="text-sm">Profile</span>
				</button>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="relative" ref={dropdownRef}>
				<button
					onClick={() => setIsOpen(!isOpen)}
					className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#44475a] hover:bg-[#bd93f9] text-[#f8f8f2] hover:text-[#282a36] font-bold transition-colors border-2 border-[#bd93f9]"
					title="User menu"
				>
					<div className="w-6 h-6 rounded-full bg-[#282a36] flex items-center justify-center">
						<Icon path={mdiAccount} size={0.5} color="#bd93f9" />
					</div>
					<span className="text-sm">Profile</span>
				</button>

				{isOpen && (
					<div className="absolute top-full right-0 mt-2 w-48 bg-[#44475a] border-2 border-[#bd93f9] rounded-lg shadow-lg z-50">
						<Link href="/login">
							<button
								onClick={() => setIsOpen(false)}
								className="w-full text-left px-4 py-3 text-[#f8f8f2] hover:bg-[#bd93f9] hover:text-[#282a36] transition-colors font-medium rounded-t-md flex items-center gap-2"
							>
								<Icon path={mdiLock} size={0.5} color="currentColor" />
								Sign In
							</button>
						</Link>
						<Link href="/register">
							<button
								onClick={() => setIsOpen(false)}
								className="w-full text-left px-4 py-3 text-[#f8f8f2] hover:bg-[#bd93f9] hover:text-[#282a36] transition-colors font-medium rounded-b-md flex items-center gap-2"
							>
								<Icon path={mdiPencil} size={0.5} color="currentColor" />
								Register
							</button>
						</Link>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#44475a] hover:bg-[#bd93f9] text-[#f8f8f2] hover:text-[#282a36] font-bold transition-colors border-2 border-[#bd93f9]"
				title="User menu"
			>
				<div className="w-6 h-6 rounded-full bg-[#282a36] flex items-center justify-center text-[#bd93f9] font-bold text-xs">
					{getInitials(user)}
				</div>
				<span className="hidden sm:inline text-sm">{user}</span>
			</button>

			{isOpen && (
				<div className="absolute top-full right-0 mt-2 w-48 bg-[#44475a] border-2 border-[#bd93f9] rounded-lg shadow-lg z-50">
					<div className="px-4 py-3 border-b border-[#bd93f9]">
						<p className="text-[#f8f8f2] font-semibold text-sm">Logged in as</p>
						<p className="text-[#50fa7b] font-bold">{user}</p>
					</div>

					<Link href="/settings">
						<button
							onClick={() => setIsOpen(false)}
							className="w-full text-left px-4 py-2 text-[#f8f8f2] hover:bg-[#bd93f9] hover:text-[#282a36] transition-colors font-medium flex items-center gap-2"
						>
							<Icon path={mdiCog} size={0.5} color="currentColor" />
							Settings & Profile
						</button>
					</Link>

					<Link href="/logout">
						<button
							onClick={() => setIsOpen(false)}
							className="w-full text-left px-4 py-2 text-[#ff5555] hover:bg-[#ff5555] hover:text-[#f8f8f2] transition-colors font-medium rounded-b-md flex items-center gap-2"
						>
							<Icon path={mdiLogout} size={0.5} color="currentColor" />
							Logout
						</button>
					</Link>
				</div>
			)}
		</div>
	);
}
