'use client';
import { mdiArrowRight, mdiEyeOutline, mdiEyeOffOutline, mdiGoogle } from '@mdi/js';
import Icon from '@mdi/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { FormEvent, useRef, useState } from 'react';
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
 const [showPassword, setShowPassword] = useState(false);
 const [passwordFocused, setPasswordFocused] = useState(false);
 const [capsLock, setCapsLock] = useState(false);
 const [demoOpen, setDemoOpen] = useState(false);
 const submitRef = useRef<HTMLButtonElement>(null);
 const router = useRouter();
 const LOGINURL = process.env.NEXT_PUBLIC_LOGIN_URL || 'http://localhost:8080/login';
 const REGISTERURL = process.env.NEXT_PUBLIC_REGISTER_URL || 'http://localhost:8080/auth/google/login';
 const initials = username.trim().slice(0, 2).toUpperCase();

 function selectDemo(account: number) {
  setUsername(`testuser${account}`);
  setPassword(`testpassword${account}`);
  setError('');
  setShowPassword(false);
  submitRef.current?.focus();
 }
	async function handleLogin(e: FormEvent) {
		e.preventDefault();
		if (isLoading) return;
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
   <Script src={`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`} strategy="afterInteractive" />
   <header className={styles.header}>
    <Link href="/" className={styles.brand} aria-label="AnonymoUS home"><span className={styles.brandMark} aria-hidden="true">a<span>_</span></span>AnonymoUS</Link>
    <Link href="/" className={styles.back}>Back to home <span aria-hidden="true">↗</span></Link>
   </header>

   <main className={styles.main}>
    <section className={styles.panel} aria-labelledby="login-title">
     <div className={styles.identity} data-private={passwordFocused && !showPassword} aria-hidden="true">
      <span className={styles.identityText}>{passwordFocused && !showPassword ? '••' : initials || 'a_'}</span>
      <span className={styles.identityCorner} />
     </div>
     <div className={styles.heading}>
      <p className={styles.eyebrow}>YOUR NEXT CONVERSATION</p>
      <h1 id="login-title">Pick up where<br />you left off<span>.</span></h1>
      <p className={styles.subtitle}>Sign in to AnonymoUS.</p>
     </div>

     <button type="button" className={styles.google} disabled={isLoading} onClick={() => { window.location.href = REGISTERURL; }}>
      <Icon path={mdiGoogle} size={0.8} aria-hidden="true" /> Continue with Google
     </button>
     <div className={styles.divider}><span>or use your username</span></div>

     <form onSubmit={handleLogin} className={styles.form} aria-busy={isLoading}>
      <div className={styles.field}>
       <label htmlFor="username">Username</label>
       <input id="username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} required placeholder="Your username" value={username} onChange={e => { setUsername(e.target.value); setError(''); }} disabled={isLoading} aria-describedby={error ? 'login-error' : undefined} />
      </div>
      <div className={styles.field}>
       <label htmlFor="password">Password</label>
       <div className={styles.passwordWrap}>
        <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required placeholder="Your password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} onFocus={() => setPasswordFocused(true)} onBlur={() => { setPasswordFocused(false); setCapsLock(false); }} onKeyUp={e => setCapsLock(e.getModifierState('CapsLock'))} onKeyDown={e => setCapsLock(e.getModifierState('CapsLock'))} disabled={isLoading} aria-describedby={[capsLock ? 'caps-lock' : '', error ? 'login-error' : ''].filter(Boolean).join(' ') || undefined} />
        <button type="button" className={styles.reveal} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(v => !v)} disabled={isLoading}><Icon path={showPassword ? mdiEyeOffOutline : mdiEyeOutline} size={0.8} aria-hidden="true" /></button>
       </div>
       {capsLock && <p className={styles.hint} id="caps-lock" role="status">Caps Lock is on.</p>}
      </div>
      {error && <p className={styles.error} id="login-error" role="alert">{error}</p>}
      <button ref={submitRef} type="submit" className={styles.submit} disabled={isLoading}>
       <span>{isLoading ? 'Signing in…' : 'Sign in'}</span>
       {isLoading ? <span className={styles.spinner} aria-hidden="true" /> : <Icon path={mdiArrowRight} size={0.9} aria-hidden="true" />}
      </button>
      <span className={styles.srOnly} role="status">{isLoading ? 'Signing in. Please wait.' : ''}</span>
     </form>

     <div className={styles.demo}>
      <button className={styles.demoToggle} type="button" aria-expanded={demoOpen} aria-controls="demo-accounts" onClick={() => setDemoOpen(v => !v)}>
       <span>Just looking around? <strong>Try a demo</strong></span><span className={styles.plus} data-open={demoOpen} aria-hidden="true">+</span>
      </button>
      <div id="demo-accounts" hidden={!demoOpen} className={styles.demoContent}>
       <p>Choose an account, then sign in.</p>
       <div className={styles.demoAccounts}>
        {[1, 2].map(account => <button key={account} type="button" disabled={isLoading} aria-pressed={username === `testuser${account}` && password === `testpassword${account}`} onClick={() => selectDemo(account)}><span className={styles.demoAvatar}>0{account}</span><span>Demo {account}<small>testuser{account}</small></span><span className={styles.selected} aria-hidden="true">{username === `testuser${account}` && password === `testpassword${account}` ? '✓' : '↗'}</span></button>)}
       </div>
       <p className={styles.demoNote}>Shared accounts. Signing out clears both demo users’ data.</p>
      </div>
     </div>
    </section>
   </main>
   <footer className={styles.footer}><span>AnonymoUS</span><span>A little less noise. A little more conversation.</span></footer>
  </div>
 );
}
