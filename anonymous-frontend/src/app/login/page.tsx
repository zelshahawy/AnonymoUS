'use client';
import Herobg from '@/components/herobg';
import NavBar from '@/components/Navbar';
import { mdiAccount, mdiGoogle, mdiLock } from '@mdi/js';
import Icon from '@mdi/react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { FormEvent, useState } from 'react';

const SITE_KEY =
	process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
	'6Ld39FMrAAAAALKNDA3zB70pCoVC8rjqWs3iN8VF';
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
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const LOGINURL = process.env.NEXT_PUBLIC_LOGIN_URL || 'http://localhost:8080/login';
	const REGISTERURL = process.env.NEXT_PUBLIC_REGISTER_URL || 'http://localhost:8080/auth/google/login';

	async function handleLogin(e: FormEvent) {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		try {
			await new Promise<void>((resolve, reject) => {
				if (window.grecaptcha && typeof window.grecaptcha.ready === 'function') {
					window.grecaptcha.ready(resolve)
				} else {
					reject(new Error('reCAPTCHA failed to load'))
				}
			})

			const token = await window.grecaptcha.execute(SITE_KEY, { action: 'login' })

			const res = await fetch(LOGINURL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ username, password, recaptchaToken: token }),
			})

			if (!res.ok) {
				let msg = 'Invalid credentials'
				const errBody = await res.json().catch(() => null)
				if (errBody && typeof errBody.message === 'string') {
					msg = errBody.message
				}
				throw new Error(msg)
			}

			router.push('/chat')
		} catch (err: unknown) {
			console.error('login failed:', err)
			const msg = err instanceof Error ? err.message : String(err)
			setError(msg || 'Login failed')
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<>
			<Herobg />
			<NavBar />
			<Script
				src={`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`}
				strategy="afterInteractive"
			/>

			<main className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-12 text-[#f8f8f2]">
				<div className="w-full max-w-md">
					<div className="mb-7 text-center">
						<p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#bd93f9]">
							Welcome back
						</p>
						<h1 className="text-4xl md:text-5xl font-bold tracking-tight">Sign in to AnonymoUS</h1>
						<p className="mt-3 text-[15px] text-[#a3a9bd]">Continue to your conversations.</p>
					</div>

					<section className="bg-[#21222c]/90 border border-[#33354a] rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/40 backdrop-blur-sm" aria-labelledby="login-heading">
						<h2 id="login-heading" className="sr-only">Sign in</h2>

						{error && (
							<div role="alert" className="mb-5 px-4 py-3 bg-[#ff5555]/10 border border-[#ff5555]/30 text-[#ff9a9a] rounded-xl text-sm">
								{error}
							</div>
						)}

						<form onSubmit={handleLogin} className="space-y-4">
							<div>
								<label htmlFor="username" className="block text-[#c9ccd6] font-medium mb-1.5 text-sm">Username</label>
								<div className="relative">
									<div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#777b8e]">
										<Icon path={mdiAccount} size={0.75} color="currentColor" />
									</div>
									<input
										id="username"
										name="username"
										autoComplete="username"
										required
										value={username}
										onChange={(e) => setUsername(e.target.value)}
										className="w-full pl-11 pr-4 py-3 bg-[#2a2c39] text-[#f8f8f2] placeholder-[#777b8e] rounded-xl border border-[#3a3c4d] hover:border-[#4a4d61] focus:outline-none focus:border-[#bd93f9] focus:ring-2 focus:ring-[#bd93f9]/15 transition-colors"
										placeholder="Enter your username"
										disabled={isLoading}
									/>
								</div>
							</div>

							<div>
								<label htmlFor="password" className="block text-[#c9ccd6] font-medium mb-1.5 text-sm">Password</label>
								<div className="relative">
									<div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#777b8e]">
										<Icon path={mdiLock} size={0.75} color="currentColor" />
									</div>
									<input
										id="password"
										name="password"
										type="password"
										autoComplete="current-password"
										required
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className="w-full pl-11 pr-4 py-3 bg-[#2a2c39] text-[#f8f8f2] placeholder-[#777b8e] rounded-xl border border-[#3a3c4d] hover:border-[#4a4d61] focus:outline-none focus:border-[#bd93f9] focus:ring-2 focus:ring-[#bd93f9]/15 transition-colors"
										placeholder="Enter your password"
										disabled={isLoading}
									/>
								</div>
							</div>

							<button
								type="submit"
								disabled={isLoading}
								className="w-full bg-[#bd93f9] hover:bg-[#caa5fb] text-[#21222c] py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
							>
								{isLoading ? (
									<>
										<span className="w-4 h-4 border-2 border-[#21222c]/30 border-t-[#21222c] rounded-full animate-spin" />
										Signing in…
									</>
								) : (
									<>
										Sign in
										<span aria-hidden="true">→</span>
									</>
								)}
							</button>

							<div className="relative my-5">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-[#3a3c4d]"></div>
								</div>
								<div className="relative flex justify-center text-xs">
									<span className="px-3 bg-[#21222c] text-[#777b8e]">or</span>
								</div>
							</div>

							<button
								type="button"
								onClick={() => window.location.href = REGISTERURL}
								disabled={isLoading}
								className="w-full bg-[#2a2c39] hover:bg-[#33354a] text-[#f8f8f2] py-3 rounded-xl font-semibold border border-[#3a3c4d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
							>
								<Icon path={mdiGoogle} size={0.8} color="#bd93f9" />
								Continue with Google
							</button>
						</form>

						<div className="mt-7 pt-6 border-t border-[#3a3c4d]">
							<div className="flex items-center justify-between gap-3 mb-3">
								<p className="text-sm font-semibold text-[#e4e6ee]">Try a demo account</p>
								<span className="text-xs text-[#777b8e]">Click to fill</span>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
								{[
									['testuser1', 'testpassword1'],
									['testuser2', 'testpassword2'],
								].map(([demoUsername, demoPassword]) => (
									<button
										type="button"
										key={demoUsername}
										onClick={() => {
											setUsername(demoUsername);
											setPassword(demoPassword);
										}}
										className="rounded-xl border border-[#3a3c4d] bg-[#1a1b23] px-3 py-2.5 text-left hover:border-[#bd93f9]/70 hover:bg-[#bd93f9]/5 transition-colors"
									>
										<span className="block font-mono text-xs font-semibold text-[#bd93f9]">{demoUsername}</span>
										<span className="mt-0.5 block font-mono text-[11px] text-[#8d91a3]">{demoPassword}</span>
									</button>
								))}
							</div>
						</div>
					</section>
					<p className="mt-5 text-center text-sm text-[#8d91a3]">
						New here?{' '}
						<button type="button" onClick={() => window.location.href = REGISTERURL} className="font-semibold text-[#bd93f9] hover:text-[#caa5fb] transition-colors">
							Create an account
						</button>
					</p>
				</div>
			</main>
		</>
	);
}
