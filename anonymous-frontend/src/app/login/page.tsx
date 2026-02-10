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

	return (
		<>
			<NavBar />
			<Herobg />
			<Script
				src={`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`}
				strategy="afterInteractive"
			/>

			<style jsx>{`
				@keyframes slideInLeft {
					from {
						opacity: 0;
						transform: translateX(-50px);
					}
					to {
						opacity: 1;
						transform: translateX(0);
					}
				}
				@keyframes slideInRight {
					from {
						opacity: 0;
						transform: translateX(50px);
					}
					to {
						opacity: 1;
						transform: translateX(0);
					}
				}
				@keyframes float {
					0%, 100% {
						transform: translateY(0px);
					}
					50% {
						transform: translateY(-20px);
					}
				}
				.animate-slide-left {
					animation: slideInLeft 0.8s ease-out;
				}
				.animate-slide-right {
					animation: slideInRight 0.8s ease-out;
				}
				.animate-float {
					animation: float 3s ease-in-out infinite;
				}
			`}</style>

			<div className="min-h-screen flex items-center justify-center px-4 py-8">
				<div className="w-full max-w-6xl">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
						<div className="animate-slide-left hidden lg:block">
							<div className="mb-8">
								<h1 className="text-6xl font-bold text-[#f8f8f2] mb-4 flex items-center">
									<Icon path={mdiChat} size={2} color="#bd93f9" className="mr-3" />
									Connect
								</h1>
								<p className="text-2xl text-[#bd93f9] font-semibold">Instantly</p>
							</div>

							<div className="space-y-6">
								<div className="flex gap-4 items-start">
									<div className="w-12 h-12 rounded-lg bg-[#bd93f9] flex items-center justify-center flex-shrink-0">
										<Icon path={mdiChat} size={1.2} color="#282a36" />
									</div>
									<div>
										<h3 className="text-lg font-bold text-[#f8f8f2] mb-1">Real-time Messaging</h3>
										<p className="text-[#50fa7b]">Send and receive messages instantly with your contacts</p>
									</div>
								</div>

								<div className="flex gap-4 items-start">
									<div className="w-12 h-12 rounded-lg bg-[#50fa7b] flex items-center justify-center flex-shrink-0">
										<Icon path={mdiAccountMultiple} size={1.2} color="#282a36" />
									</div>
									<div>
										<h3 className="text-lg font-bold text-[#f8f8f2] mb-1">Manage Contacts</h3>
										<p className="text-[#50fa7b]">Easily add and organize your chat contacts</p>
									</div>
								</div>

								<div className="flex gap-4 items-start">
									<div className="w-12 h-12 rounded-lg bg-[#ff79c6] flex items-center justify-center flex-shrink-0">
										<Icon path={mdiShieldLock} size={1.2} color="#282a36" />
									</div>
									<div>
										<h3 className="text-lg font-bold text-[#f8f8f2] mb-1">Secure & Private</h3>
										<p className="text-[#50fa7b]">Your conversations are protected with modern security</p>
									</div>
								</div>

								<div className="flex gap-4 items-start">
									<div className="w-12 h-12 rounded-lg bg-[#ffb86c] flex items-center justify-center flex-shrink-0">
										<Icon path={mdiLightningBolt} size={1.2} color="#282a36" />
									</div>
									<div>
										<h3 className="text-lg font-bold text-[#f8f8f2] mb-1">Lightning Fast</h3>
										<p className="text-[#50fa7b]">Optimized for speed and reliability</p>
									</div>
								</div>

								<div className="flex gap-4 items-start">
									<div className="w-12 h-12 rounded-lg bg-[#8be9fd] flex items-center justify-center flex-shrink-0">
										<Icon path={mdiShieldLock} size={1.2} color="#282a36" />
									</div>
									<div>
										<h3 className="text-lg font-bold text-[#f8f8f2] mb-1">OAuth 2.0 Security</h3>
										<p className="text-[#50fa7b]">Sign in securely with Google using industry-standard OAuth 2.0 authentication</p>
									</div>
								</div>
							</div>

							<div className="mt-12 relative h-40">
								<div className="absolute top-0 left-0 w-32 h-32 bg-[#bd93f9] rounded-full opacity-10 blur-3xl animate-float"></div>
								<div className="absolute bottom-0 right-0 w-40 h-40 bg-[#50fa7b] rounded-full opacity-10 blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
							</div>
						</div>

						<div className="animate-slide-right">
							<div className="bg-gradient-to-br from-[#44475a] to-[#3d3f4d] p-8 lg:p-10 rounded-2xl shadow-2xl border-2 border-[#bd93f9] backdrop-blur-sm">
								<div className="mb-8">
									<h2 className="text-4xl font-bold text-[#f8f8f2] mb-2">Welcome Back</h2>
									<p className="text-[#76df5c]">Sign in to continue to your chats</p>
								</div>

								{error && (
									<div className="mb-6 p-4 bg-[#ff5555] bg-opacity-20 border-l-4 border-[#ff5555] text-[#f8f8f2] rounded-lg text-sm font-medium">
										<span className="font-bold">Error:</span> {error}
									</div>
								)}

								<form onSubmit={handleLogin} className="space-y-5">
									<div>
										<label className="block text-[#f8f8f2] font-semibold mb-2 text-sm">Username</label>
										<div className="relative">
											<div className="absolute left-4 top-1/2 transform -translate-y-1/2">
												<Icon path={mdiAccount} size={1.2} color="#bd93f9" />
											</div>
											<input
												value={username}
												onChange={(e) => setUsername(e.target.value)}
												className="w-full pl-12 pr-4 py-3 bg-[#282a36] border-2 border-[#6272a4] text-[#f8f8f2] placeholder-[#6272a4] rounded-lg focus:outline-none focus:border-[#bd93f9] focus:ring-2 focus:ring-[#bd93f9] focus:ring-opacity-30 transition-all"
												placeholder="testuser1"
												disabled={isLoading}
											/>
										</div>
									</div>

									<div>
										<label className="block text-[#f8f8f2] font-semibold mb-2 text-sm">Password</label>
										<div className="relative">
											<div className="absolute left-4 top-1/2 transform -translate-y-1/2">
												<Icon path={mdiLock} size={1.2} color="#bd93f9" />
											</div>
											<input
												type="password"
												value={password}
												onChange={(e) => setPassword(e.target.value)}
												className="w-full pl-12 pr-4 py-3 bg-[#282a36] border-2 border-[#6272a4] text-[#f8f8f2] placeholder-[#6272a4] rounded-lg focus:outline-none focus:border-[#bd93f9] focus:ring-2 focus:ring-[#bd93f9] focus:ring-opacity-30 transition-all"
												placeholder="testpassword1"
												disabled={isLoading}
											/>
										</div>
									</div>

									<button
										type='button'
										onClick={() => window.location.href = REGISTERURL}
										disabled={isLoading}
										className="w-full bg-gradient-to-r from-[#bd93f9] to-[#ff79c6] hover:from-[#ff79c6] hover:to-[#bd93f9] text-[#282a36] py-4 rounded-lg font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg shadow-lg"
									>
										<span className="text-xl">G</span>
										Sign up with Google
									</button>

									<p className="text-center text-[#6272a4] text-xs mt-2">Fastest way to get started</p>

									<div className="relative my-6">
										<div className="absolute inset-0 flex items-center">
											<div className="w-full border-t border-[#6272a4]"></div>
										</div>
										<div className="relative flex justify-center text-sm">
											<span className="px-2 bg-[#44475a] text-[#6272a4]">or</span>
										</div>
									</div>

									<button
										type="submit"
										disabled={isLoading}
										className="w-full bg-[#50fa7b] hover:bg-[#ff79c6] text-[#282a36] py-3 rounded-lg font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
									>
										{isLoading ? (
											<>
												<span className="inline-block animate-spin">⌛</span>
												Signing in...
											</>
										) : (
											<>
												Sign In with Username
												<span>→</span>
											</>
										)}
									</button>
								</form>

								<div className="mt-8 p-4 bg-[#282a36] border border-[#6272a4] rounded-lg">
									<p className="text-[#6272a4] text-xs leading-relaxed">
										<span className="text-[#bd93f9] font-semibold">Demo Credentials:</span><br />
										Username: <span className="text-[#50fa7b] font-mono">testuser1</span> or <span className="text-[#50fa7b] font-mono">testuser2</span><br />
										Password: <span className="text-[#50fa7b] font-mono">testpassword1</span> or <span className="text-[#50fa7b] font-mono">testpassword2</span><br />
										<span className="text-[#ff5555] mt-2 block">⚠ Data is shared and cleared on logout</span>
									</p>
								</div>
							</div>

						</div>
					</div>
				</div>
			</div>
		</>
	);
}
