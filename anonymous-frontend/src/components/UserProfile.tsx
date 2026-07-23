'use client';
import { mdiAccount, mdiCog, mdiLogout } from '@mdi/js';
import Icon from '@mdi/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface UserProfileProps {
	user?: string;
}

export default function UserProfile({ user: propUser }: UserProfileProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [user, setUser] = useState<string | undefined>(undefined);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const checkUser = async () => {
		try {
			const res = await fetch('/api/me', {
				credentials: 'include',
			});
			if (res.ok) {
				const data = await res.json();
				console.log('User fetched:', data.username);
				setUser(data.username);
				return;
			} else {
				console.log('Failed to fetch user, status:', res.status);
			}
		} catch (err) {
			console.error('Failed to fetch user:', err);
		}

		setUser(undefined);
	};

	useEffect(() => {
		checkUser();

		const handleFocus = () => checkUser();
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				checkUser();
			}
		};

		window.addEventListener('focus', handleFocus);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			window.removeEventListener('focus', handleFocus);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
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

	if (!user) {
		return (
			<div className="relative" ref={dropdownRef}>
				<button
					onClick={() => setIsOpen(!isOpen)}
					className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[#2a2c39] hover:bg-[#33354a] text-[#f8f8f2] font-medium transition-colors border border-[#33354a]"
					title="User menu"
				>
					<div className="w-6 h-6 rounded-full bg-[#21222c] flex items-center justify-center">
						<Icon path={mdiAccount} size={0.55} color="#bd93f9" />
					</div>
					<span className="text-sm">Profile</span>
				</button>

				{isOpen && (
					<div className="absolute top-full right-0 mt-2 w-48 bg-[#21222c] border border-[#33354a] rounded-xl shadow-xl overflow-hidden z-50 p-1">
						<Link href="/login">
							<button
								onClick={() => setIsOpen(false)}
								className="w-full text-left px-3 py-2.5 rounded-lg text-[#f8f8f2] hover:bg-[#2a2c39] transition-colors font-medium"
							>
								Sign In
							</button>
						</Link>
						<Link href="/register">
							<button
								onClick={() => setIsOpen(false)}
								className="w-full text-left px-3 py-2.5 rounded-lg text-[#f8f8f2] hover:bg-[#2a2c39] transition-colors font-medium"
							>
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
				className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-[#2a2c39] hover:bg-[#33354a] text-[#f8f8f2] font-medium transition-colors border border-[#33354a]"
				title="User menu"
			>
				<div className="w-6 h-6 rounded-full bg-[#bd93f9] flex items-center justify-center text-[#21222c] font-bold text-[10px]">
					{getInitials(user)}
				</div>
				<span className="text-sm">{user}</span>
			</button>

			{isOpen && (
				<div className="absolute top-full right-0 mt-2 w-52 bg-[#21222c] border border-[#33354a] rounded-xl shadow-xl overflow-hidden z-50">
					<div className="px-4 py-3 border-b border-[#33354a]">
						<p className="text-[#8b8fa3] text-xs">Logged in as</p>
						<p className="text-[#f8f8f2] font-semibold truncate">{user}</p>
					</div>

					<div className="p-1">
						<Link href="/settings">
							<button
								onClick={() => setIsOpen(false)}
								className="w-full text-left px-3 py-2.5 rounded-lg text-[#f8f8f2] hover:bg-[#2a2c39] transition-colors font-medium flex items-center gap-2.5"
							>
								<Icon path={mdiCog} size={0.55} color="#bd93f9" />
								Settings & Profile
							</button>
						</Link>

						<Link href="/logout">
							<button
								onClick={() => setIsOpen(false)}
								className="w-full text-left px-3 py-2.5 rounded-lg text-[#ff5555] hover:bg-[#ff5555]/10 transition-colors font-medium flex items-center gap-2.5"
							>
								<Icon path={mdiLogout} size={0.55} color="currentColor" />
								Logout
							</button>
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}
