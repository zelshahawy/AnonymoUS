import { jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import RedirectLogin from '../chat/RedirectLogin';
import SettingsClient from './settings-client';

interface TokenPayload extends JWTPayload {
	sub: string
}

export default async function SettingsPage() {
	const cookieStore = await cookies();
	const token = cookieStore.get('auth_token')?.value
	const JWT_SECRET = process.env.JWT_SECRET || "KDSJBASJKBA"
	if (!token) return <RedirectLogin />

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
	return <SettingsClient user={user} />
}
