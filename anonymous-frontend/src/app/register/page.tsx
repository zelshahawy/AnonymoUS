'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function RegisterPage() {
	const params = useSearchParams();
	const googleID = params.get('googleID') || '';
	const email = params.get('email') || '';
	const [username, setUsername] = useState(email.split('@')[0]);
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const router = useRouter();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		const res = await fetch('http://localhost:8081/auth/register-external', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({ googleID, email, username, password }),
		});
		if (!res.ok) {
			setError(await res.text());
			return;
		}
		// on success, backend sets JWT cookie and we navigate to chat
		router.push('/chat');
	};

	return (
		<form onSubmit={handleSubmit} className="…">
			<h1>Complete your registration</h1>
			<p>Google account: {email}</p>
			{error && <p className="text-red-500">{error}</p>}
			<label>Username</label>
			<input value={username} onChange={e => setUsername(e.target.value)} />
			<label>Password</label>
			<input type="password" value={password} onChange={e => setPassword(e.target.value)} />
			<button type="submit">Finish Sign Up</button>
		</form>
	);
}
