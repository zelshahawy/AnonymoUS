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
			<p className="p-6 text-center">
				Logging you out…
			</p>
		</>
	);
}
