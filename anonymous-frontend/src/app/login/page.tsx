'use client';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function LoginPage() {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const router = useRouter();

	const LOGINURL = process.env.NEXT_PUBLIC_LOGIN_URL || 'http://localhost:8081/login';
	if (!LOGINURL) throw new Error('LOGINURL is not defined');

	const handleLogin = async (e: FormEvent) => {
		e.preventDefault();
		setError('');
		try {
			const res = await fetch(LOGINURL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', },
				credentials: 'include',
				body: JSON.stringify({ username, password }),
			});
			if (!res.ok) throw new Error('Invalid credentials');
			router.push('/chat?user=' + encodeURIComponent(username));
		} catch (err: unknown) {
			setError((err as Error).message || 'Login failed');
		}
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gray-500">
			<h1 className="text-4xl font-bold mb-6">Log In</h1>
			<form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-6 rounded-lg shadow">
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
	);
}
