import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import ChatClient from './chatClient';
import RedirectLogin from './RedirectLogin';

export default async function ChatPage() {
	// grab token from cookie
	const cookieStore = await cookies();
	const token = cookieStore.get('auth_token')?.value
	const JWT_SECRET = process.env.JWT_SECRET || "KDSJBASJKBA"
	if (!token) return <RedirectLogin />

	// verify & decode JWT
	let payload: any
	try {
		; ({ payload } = await jwtVerify(
			token,
			new TextEncoder().encode(JWT_SECRET),
			{ algorithms: ['HS256'] }
		))
	} catch {
		return <RedirectLogin />
	}

	const user = payload.sub as string
	console.log('ChatPage user:', user)
	return <ChatClient user={user} />
}
