'use client';

import { redirect, useSearchParams } from 'next/navigation';
import { ReactNode, Suspense } from 'react';

export default function RegisterLayout({ children }: { children: ReactNode }) {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center text-white">
					Loading…
				</div>
			}
		>
			<Guard>{children}</Guard>
		</Suspense>
	);
}

function Guard({ children }: { children: ReactNode }) {
	const params = useSearchParams();
	const googleID = params.get('googleID');
	if (!googleID) {
		redirect('/login');
	}
	return <>{children}</>;
}
