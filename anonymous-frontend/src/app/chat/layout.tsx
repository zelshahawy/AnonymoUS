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
	// otherwise render the chat UI
	return <>{children}</>;
}
