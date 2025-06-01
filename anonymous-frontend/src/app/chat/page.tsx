import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ChatClient from './chatClient';

export default async function ChatPage() {
	// Server‐side check via heartbeat proxy
	const cookieStore = await cookies();
	const res = await fetch('http://localhost:3000/heartbeat', {
		method: 'GET',
		cache: 'no-store',
		headers: { 'Cookie': `auth_token=${cookieStore.get('auth_token')?.value}` }
	})
	if (!res.ok) return redirect('/login')
	const payload = await res.json();
	const user = payload.sub as string;
	return <ChatClient user={user} />;
}
