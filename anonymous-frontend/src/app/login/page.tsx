'use client';
import Herobg from '@/components/herobg';
import NavBar from '@/components/Navbar';
import { mdiAccount, mdiAccountMultiple, mdiChat, mdiLightningBolt, mdiLock, mdiShieldLock } from '@mdi/js';
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

	const features = [
		{ icon: mdiChat, title: 'Real-time messaging', text: 'Send and receive messages instantly with your contacts.' },
		{ icon: mdiAccountMultiple, title: 'Manage contacts', text: 'Easily add and organize your chat contacts.' },
		{ icon: mdiLightningBolt, title: 'Lightning fast', text: 'Optimized for speed and reliability.' },
		{ icon: mdiShieldLock, title: 'OAuth 2.0 security', text: 'Sign in securely with Google using industry-standard OAuth 2.0.' },
	];

	return (
		<>
			<NavBar />
			<Herobg />
			<Script
				src={`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`}
				strategy="afterInteractive"
			/>

			<div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-12 text-[#f8f8f2]">
				<div className="w-full max-w-5xl">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
						<div className="hidden lg:block">
							<h1 className="text-5xl font-bold tracking-tight mb-10 flex items-center">
								<Icon path={mdiChat} size={1.6} color="#bd93f9" className="mr-4" />
								Anonymous
							</h1>

							<div className="space-y-2">
								{features.map(f => (
									<div key={f.title} className="flex gap-4 items-start p-4 rounded-xl">
										<div className="w-10 h-10 rounded-xl bg-[#bd93f9]/10 text-[#bd93f9] flex items-center justify-center shrink-0">
											<Icon path={f.icon} size={0.8} color="currentColor" />
										</div>
										<div>
											<h3 className="font-semibold mb-1">{f.title}</h3>
											<p className="text-sm text-[#8b8fa3] leading-relaxed">{f.text}</p>
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="bg-[#21222c]/90 border border-[#33354a] rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/40">
							<div className="mb-7">
								<h2 className="text-3xl font-bold tracking-tight mb-1.5">Welcome back</h2>
								<p className="text-[#8b8fa3] text-sm">Sign in to continue to your chats</p>
							</div>

							{error && (
								<div className="mb-5 px-4 py-3 bg-[#ff5555]/10 border border-[#ff5555]/30 text-[#ff9a9a] rounded-xl text-sm">
									{error}
								</div>
							)}

							<form onSubmit={handleLogin} className="space-y-4">
								<div>
									<label className="block text-[#c9ccd6] font-medium mb-1.5 text-sm">Username</label>
									<div className="relative">
										<div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b6f80]">
											<Icon path={mdiAccount} size={0.75} color="currentColor" />
										</div>
										<input
											value={username}
											onChange={(e) => setUsername(e.target.value)}
											className="w-full pl-11 pr-4 py-3 bg-[#2a2c39] text-[#f8f8f2] placeholder-[#6b6f80] rounded-xl border border-transparent focus:outline-none focus:border-[#bd93f9] transition-colors"
											placeholder="testuser1"
											disabled={isLoading}
										/>
									</div>
								</div>

								<div>
									<label className="block text-[#c9ccd6] font-medium mb-1.5 text-sm">Password</label>
									<div className="relative">
										<div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b6f80]">
											<Icon path={mdiLock} size={0.75} color="currentColor" />
										</div>
										<input
											type="password"
											value={password}
											onChange={(e) => setPassword(e.target.value)}
											className="w-full pl-11 pr-4 py-3 bg-[#2a2c39] text-[#f8f8f2] placeholder-[#6b6f80] rounded-xl border border-transparent focus:outline-none focus:border-[#bd93f9] transition-colors"
											placeholder="testpassword1"
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
											<span>→</span>
										</>
									)}
								</button>

								<div className="relative my-5">
									<div className="absolute inset-0 flex items-center">
										<div className="w-full border-t border-[#33354a]"></div>
									</div>
									<div className="relative flex justify-center text-xs">
										<span className="px-3 bg-[#21222c] text-[#6b6f80]">or</span>
									</div>
								</div>

								<button
									type='button'
									onClick={() => window.location.href = REGISTERURL}
									disabled={isLoading}
									className="w-full bg-[#2a2c39] hover:bg-[#33354a] text-[#f8f8f2] py-3 rounded-xl font-semibold border border-[#33354a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
								>
									<span className="font-bold text-[#bd93f9]">G</span>
									Continue with Google
								</button>

								<p className="text-center text-[#6b6f80] text-xs">Fastest way to get started</p>
							</form>

							<div className="mt-7 p-4 bg-[#1a1b23] border border-[#33354a] rounded-xl">
								<p className="text-[#8b8fa3] text-xs leading-relaxed">
									<span className="text-[#bd93f9] font-semibold">Demo credentials</span><br />
									Username: <span className="text-[#f8f8f2] font-mono">testuser1</span> or <span className="text-[#f8f8f2] font-mono">testuser2</span><br />
									Password: <span className="text-[#f8f8f2] font-mono">testpassword1</span> or <span className="text-[#f8f8f2] font-mono">testpassword2</span><br />
									<span className="text-[#ffb86c] mt-2 block">⚠ Data is shared and cleared on logout</span>
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
