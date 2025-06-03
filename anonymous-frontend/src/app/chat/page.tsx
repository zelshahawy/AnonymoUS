import { jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import ChatClient from './chatClient';
import RedirectLogin from './RedirectLogin';

interface TokenPayload extends JWTPayload {
	sub: string
}

export default async function ChatPage() {
	// grab token from cookie
	const cookieStore = await cookies();
	const token = cookieStore.get('auth_token')?.value
	const JWT_SECRET = "123923-1234-1234-1234-123456789012"
	if (!token) return <RedirectLogin />

	// verify & decode JWT
	let payload: TokenPayload
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
	return <ChatClient user={user} token={token} />
}
