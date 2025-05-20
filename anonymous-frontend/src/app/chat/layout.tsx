// src/app/chat/layout.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

interface Props { children: ReactNode }

export default async function ChatLayout({ children }: Props) {
	// read our JWT cookie
	const LOGINURL = process.env.NEXT_PUBLIC_LOGIN_URL || '/login';
	const cookieStore = await cookies();
	const token = cookieStore.get('auth_token')?.value;
	if (!token) {
		redirect(LOGINURL);
	}
	let res;
	try {
		res = await fetch('http://localhost:8081/heartbeat', {
			method: 'GET',
			cache: 'no-store',
			headers: {
				'Cookie': `auth_token=${token}`
			},
		});
	} catch (error) {
		console.error('Error fetching heartbeat:', error);
		redirect(LOGINURL);
	}

	if (!res || !res.ok) {
		return redirect(LOGINURL);
	}

	return <>{children}</>;
}
