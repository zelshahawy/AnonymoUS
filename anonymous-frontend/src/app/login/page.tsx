'use client';
import Herobg from '@/components/herobg';
import NavBar from '@/components/Navbar';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { FormEvent, useState } from 'react';


const SITE_KEY = '6LehuFQrAAAAAEQGx8PoQtlHtzZe1Gp66B1djg5y';
declare global {
	interface Window {
		grecaptcha: {
			ready: (cb: () => void) => void;
			execute: (
				siteKey: string,
				options: { action: string }
			) => Promise<string>;
		};
	}
}

export default function LoginPage() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const router = useRouter();

	const LOGINURL = 'http://localhost:8080/login';


	async function handleLogin(e: FormEvent) {
		e.preventDefault();
		setError('');

		// wait until the grecaptcha library is loaded & ready
		await new Promise<void>((resolve) => window.grecaptcha.ready(resolve));

		try {
			// 1) wait until grecaptcha is actually loaded (or fail)
			await new Promise<void>((resolve, reject) => {
				if (window.grecaptcha && typeof window.grecaptcha.ready === 'function') {
					window.grecaptcha.ready(resolve)
				} else {
					reject(new Error('reCAPTCHA failed to load'))
				}
			})

			// 2) execute reCAPTCHA
			const token = await window.grecaptcha.execute(SITE_KEY, { action: 'login' })

			// 3) hit the backend
			const res = await fetch(LOGINURL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ username, password, recaptchaToken: token }),
			})

			// 4) if bad status, try to parse JSON error, else fallback
			if (!res.ok) {
				let msg = 'Invalid credentials'
				const errBody = await res.json().catch(() => null)
				if (errBody && typeof errBody.message === 'string') {
					msg = errBody.message
				}
				throw new Error(msg)
			}

			// 5) success → navigate
			router.push('/chat')
		} catch (err: unknown) {
			console.error('login failed:', err)
			const msg = err instanceof Error ? err.message : String(err)
			setError(msg || 'Login failed')
		}
	}

	return (
		<>
			<NavBar />
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
				<p className="mb-4 text-white text-sm text-center max-w-md">
					You can use <strong>testuser1 / testpassword1</strong> or <strong>testuser2 / testpassword2</strong> to try out the app. All chat data is lost when you log out and these accounts are shared—do not enter any sensitive information. Please remember to log out responsibly.
				</p>
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
							className="w-full px-3 py-2 border rounded text-black"
							placeholder="testuser1"
						/>
					</div>
					<div className="mb-6">
						<label className="block text-gray-700 mb-2">Password</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full px-3 py-2 border rounded text-black"
							placeholder="testpassword1"
						/>
					</div>
					<button
						type="submit"
						className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
					>
						Log In
					</button>
					<div className="mt-4">
						<button type='button'
							onClick={() => window.location.href = 'http://localhost:8080/auth/google/login'}

							className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
						>
							<FontAwesomeIcon icon={faGoogle} className="mr-2" />
							Regsiter and sign in with Google
						</button>
					</div>
				</form>
			</div>
		</>
	);
}
