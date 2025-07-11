'use client';

import NavBar from '@/components/Navbar';
import Herobg from '@/components/herobg';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function RegisterClient() {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const router = useRouter();

	async function handleRegister(e: FormEvent) {
		e.preventDefault();
		setError('');

		const res = await fetch(
			process.env.NEXT_PUBLIC_REGISTER_URL || 'http://localhost:8080/register',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ username, email, password }),
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
			<div className="min-h-screen flex flex-col items-center justify-center px-4">
				<h1 className="text-4xl font-bold mb-6 text-white">Create Account</h1>
				<p className="mb-4 text-white text-center max-w-md text-sm">
					Choose a username and password to create your account.
				</p>
				<form
					onSubmit={handleRegister}
					className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg"
				>
					{error && <p className="text-red-500 mb-4">{error}</p>}
					<div className="mb-4">
						<label className="block text-gray-700 mb-2">Username</label>
						<input
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="w-full px-3 py-2 border rounded text-black"
							placeholder="your username"
							required
						/>
					</div>
					<div className="mb-4">
						<label className="block text-gray-700 mb-2">Email</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full px-3 py-2 border rounded text-black"
							placeholder="your email"
						/>
					</div>
					<div className="mb-6">
						<label className="block text-gray-700 mb-2">Password</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full px-3 py-2 border rounded text-black"
							placeholder="••••••••"
							required
						/>
					</div>
					<button
						type="submit"
						className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
					>
						Create Account
					</button>
				</form>
			</div>
		</>
	);
}
