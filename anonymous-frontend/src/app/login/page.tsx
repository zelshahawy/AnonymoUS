'use client';
import NavBar from '@/components/Navbar';
import { mdiAccount, mdiGoogle, mdiLock } from '@mdi/js';
import Icon from '@mdi/react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { FormEvent, useState } from 'react';
import SignalSculpture from './SignalSculpture';
import styles from './login.module.css';

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
		<div className={styles.page}>
			<NavBar />
			<Script
				src={`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`}
				strategy="afterInteractive"
			/>
			<main className={styles.layout}>
				<SignalSculpture />
				<section className={styles.formArea} aria-labelledby="login-heading">
					<header className={styles.heading}>
						<p className={styles.eyebrow}>Welcome to AnonymoUS</p>
						<h1 id="login-heading">Welcome back.</h1>
						<p className={styles.subtitle}>Pick up where you left off.</p>
					</header>
					{error && <div role="alert" className={styles.error}>{error}</div>}
					<form onSubmit={handleLogin} className={styles.form}>
						<div className={styles.field}>
							<label htmlFor="username">Username</label>
							<div className={styles.inputWrap}>
								<span className={styles.inputIcon}><Icon path={mdiAccount} size={0.7} aria-hidden="true" /></span>
								<input id="username" name="username" autoComplete="username" required
									value={username} onChange={(e) => setUsername(e.target.value)}
									placeholder="Enter your username" disabled={isLoading} />
							</div>
						</div>
						<div className={styles.field}>
							<label htmlFor="password">Password</label>
							<div className={styles.inputWrap}>
								<span className={styles.inputIcon}><Icon path={mdiLock} size={0.7} aria-hidden="true" /></span>
								<input id="password" name="password" type="password" autoComplete="current-password" required
									value={password} onChange={(e) => setPassword(e.target.value)}
									placeholder="Enter your password" disabled={isLoading} />
							</div>
						</div>
						<button type="submit" disabled={isLoading} className={styles.primary}>
							{isLoading ? <><span className={styles.spinner} aria-hidden="true" />Signing in…</> : <>Sign in <span aria-hidden="true">↗</span></>}
						</button>
						<div className={styles.divider}>or</div>
						<button type="button" onClick={() => window.location.href = REGISTERURL} disabled={isLoading} className={styles.google}>
							<Icon path={mdiGoogle} size={0.75} aria-hidden="true" />Continue with Google
						</button>
					</form>
					<div className={styles.demo}>
						<div className={styles.demoHeading}><p>Just looking around?</p><span>Try a demo account</span></div>
						<div className={styles.demoAccounts}>
							{[['testuser1', 'testpassword1'], ['testuser2', 'testpassword2']].map(([demoUsername, demoPassword]) => (
								<button type="button" key={demoUsername} disabled={isLoading}
									aria-label={`Fill credentials for ${demoUsername}`}
									onClick={() => { setUsername(demoUsername); setPassword(demoPassword); }}>
									{demoUsername}<span aria-hidden="true">↗</span>
								</button>
							))}
						</div>
					</div>
					<p className={styles.signup}>New here?{' '}
						<button type="button" onClick={() => window.location.href = REGISTERURL}>Create an account</button>
					</p>
				</section>
			</main>
		</div>
	);
}
