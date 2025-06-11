"use client";
import { redirect, useSearchParams } from 'next/navigation';
import { ReactNode } from 'react';

// This is a **server** component: Next.js calls it before rendering any child.
export default function RegisterLayout({ children }: { children: ReactNode }) {
	const params = useSearchParams();
	const googleID = params.get('googleID');

	if (!googleID) {
		redirect('/login');
	}

	return <>{children}</>;
}
