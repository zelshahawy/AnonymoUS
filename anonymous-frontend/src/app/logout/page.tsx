'use client';

import HeroBg from '@/components/herobg';
import { useEffect } from 'react';

export default function LogoutPage() {
	useEffect(() => {
		// 1) clear any client‐side storage
		window.localStorage.clear();
		window.sessionStorage.clear();

		const logoutURL =
			process.env.NEXT_PUBLIC_LOGOUT_URL || 'http://localhost:8080/logout';
		window.location.href = logoutURL;
	}, []);

	return (
		<>
			<HeroBg />
			<div className="min-h-screen flex flex-col items-center justify-center gap-4 text-[#8b8fa3]">
				<span className="w-8 h-8 border-2 border-[#33354a] border-t-[#bd93f9] rounded-full animate-spin" />
				<p>Logging you out…</p>
			</div>
		</>
	);
}
