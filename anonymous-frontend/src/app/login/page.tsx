'use client';
import Herobg from '@/components/herobg';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { FormEvent, useState } from 'react';

const SITE_KEY =
	process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
	'6LcF4FErAAAAAIcuSOwJ8Bh605MYV2rE7Nij1tzK';

export default function LoginPage() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const router = useRouter();

	const LOGINURL =
		process.env.NEXT_PUBLIC_LOGIN_URL || 'http://localhost:8081/login';

	async function handleLogin(e: FormEvent) {
		e.preventDefault();
		setError('');

		// wait until the grecaptcha library is loaded & ready
		await new Promise((res) => (window as any).grecaptcha.ready(res));

		try {
			const token = await (window as any).grecaptcha.execute(SITE_KEY, {
				action: 'login',
			});

			const res = await fetch(LOGINURL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ username, password, recaptchaToken: token }),
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.message || 'Invalid credentials');
			}

			router.push('/chat');
		} catch (err: any) {
			setError(err.message);
		}
	}

	return (
		<>
			<Herobg />
			{/* load reCAPTCHA v3 */}
			<Script
				src={`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`}
				strategy="afterInteractive"
			/>
			<style jsx global>{`
        .grecaptcha-badge {
          position: fixed !important;
          bottom: auto !important;
          top: 0px !important;
        }
      `}</style>

			<div className="min-h-screen flex flex-col items-center justify-center">
				<h1 className="text-4xl font-bold mb-6">Log In</h1>
				<form
					onSubmit={handleLogin}
					className="w-full max-w-sm bg-white p-6 rounded-lg shadow"
				>
					{error && <p className="text-red-500 mb-4">{error}</p>}
					<div className="mb-4">
						<label className="block text-gray-700 mb-2">Username</label>
						<input
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="w-full px-3 py-2 border rounded"
							placeholder="testuser1"
						/>
					</div>
					<div className="mb-6">
						<label className="block text-gray-700 mb-2">Password</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full px-3 py-2 border rounded"
							placeholder="testpassword1"
						/>
					</div>
					<button
						type="submit"
						className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
					>
						Log In
					</button>
				</form>
			</div>
		</>
	);
}
