'use client';

import HeroBg from '@/components/herobg';
import { useEffect } from 'react';

export default function LogoutPage() {
	useEffect(() => {
		// 1) clear any client‐side storage
		window.localStorage.clear();
		window.sessionStorage.clear();

		const logoutURL =
			"https://anon-backend.ziad-unit-64e.com/logout";
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
