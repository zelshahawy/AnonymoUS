'use client';

import NavBar from '@/components/Navbar';
import Herobg from '@/components/herobg';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { FormEvent, useState } from 'react';

const SITE_KEY =
	process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
	'6Ld39FMrAAAAALKNDA3zB70pCoVC8rjqWs3iN8VF';

export default function RegisterClient() {
	const params = useSearchParams();
	const googleID = params.get('googleID') || '';
	const email = params.get('email') || '';
	const [username, setUsername] = useState(email.split('@')[0]);
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const router = useRouter();

	async function handleRegister(e: FormEvent) {
		e.preventDefault();
		setError('');

		await new Promise<void>((resolve) => window.grecaptcha.ready(resolve));
		const token = await window.grecaptcha.execute(SITE_KEY, { action: 'register' });

		const res = await fetch(
			process.env.NEXT_PUBLIC_REGISTER_EXTERNAL_URL ||
			'/api/auth/register-external',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ googleID, email, username, password, recaptchaToken: token }),
			}
		);


		if (!res.ok) {
			let errMsg = 'Registration failed';
			const ct = res.headers.get('content-type') || '';
			if (ct.startsWith('application/json')) {
				const payload = (await res.json().catch(() => null)) as {
					error?: string;
					message?: string;
				} | null;
				errMsg = payload?.error || payload?.message || errMsg;
			} else {
				errMsg = await res.text().catch(() => errMsg);
			}
			setError(errMsg);
			return;
		}

		const { token: authToken } = (await res.json()) as { token: string };
		if (!authToken) {
			setError('No authentication token received');
			return;
		}
		document.cookie = `auth_token=${authToken}; path=/; max-age=31536000; secure; samesite=strict`;

		router.push('/chat');
	}

	return (
		<>
			<NavBar />
			<Herobg />
			<Script
				src={`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`}
				strategy="afterInteractive"
			/>
			<div className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-12 text-[#f8f8f2]">
				<div className="w-full max-w-md bg-[#21222c]/90 border border-[#33354a] rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/40">
					<div className="mb-6">
						<h1 className="text-3xl font-bold tracking-tight mb-1.5">Almost there</h1>
						<p className="text-[#8b8fa3] text-sm leading-relaxed">
							You&apos;re signing up with{' '}
							<span className="text-[#bd93f9] font-medium break-all">{email}</span>. Pick a username
							and password to finish creating your account.
						</p>
					</div>

					<form onSubmit={handleRegister} className="space-y-4">
						{error && (
							<div className="px-4 py-3 bg-[#ff5555]/10 border border-[#ff5555]/30 text-[#ff9a9a] rounded-xl text-sm">
								{error}
							</div>
						)}
						<div>
							<label className="block text-[#c9ccd6] font-medium mb-1.5 text-sm">Username</label>
							<input
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								className="w-full px-4 py-3 bg-[#2a2c39] text-[#f8f8f2] placeholder-[#6b6f80] rounded-xl border border-transparent focus:outline-none focus:border-[#bd93f9] transition-colors"
								placeholder="your username"
								required
							/>
						</div>
						<div>
							<label className="block text-[#c9ccd6] font-medium mb-1.5 text-sm">Password</label>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full px-4 py-3 bg-[#2a2c39] text-[#f8f8f2] placeholder-[#6b6f80] rounded-xl border border-transparent focus:outline-none focus:border-[#bd93f9] transition-colors"
								placeholder="••••••••"
								required
							/>
						</div>
						<button
							type="submit"
							className="w-full bg-[#bd93f9] hover:bg-[#caa5fb] text-[#21222c] py-3 rounded-xl font-bold transition-colors mt-2"
						>
							Create account
						</button>
					</form>
				</div>
			</div>
		</>
	);
}
