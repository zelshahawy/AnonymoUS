'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';

interface Message {
	type: 'chat' | 'history';
	from: string;
	to: string;
	body: string;
	messageid: string;
}

export default function ChatPage() {
	const router = useRouter();
	const params = useSearchParams();
	const user = params.get('user') || '';
	const [peer, setPeer] = useState('');
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState('');
	const endRef = useRef<HTMLDivElement>(null);

	// Redirect if not authenticated
	useEffect(() => {
		fetch('/heartbeat', { credentials: 'include' })
			.then(res => res.ok || Promise.reject())
			.catch(() => router.push('/login'));
	}, [router]);

	// Open WS when peer set
	useEffect(() => {
		if (!peer) return;
		const ws = new WebSocket(`ws://${window.location.host}/ws`);
		ws.onopen = () => ws.send(JSON.stringify({ type: 'history', to: peer }));
		ws.onmessage = (e: MessageEvent) => {
			const msg: Message = JSON.parse(e.data);
			setMessages(prev => [...prev, msg]);
		};
		setSocket(ws);
		return () => ws.close();
	}, [peer]);

	// Scroll
	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const sendMessage = () => {
		if (socket && input.trim()) {
			socket.send(JSON.stringify({ type: 'chat', to: peer, body: input }));
			setInput('');
		}
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			sendMessage();
		}
	};

	return (
		<div className="flex flex-col h-screen">
			<header className="p-4 bg-blue-600 text-white flex items-center">
				<input
					placeholder="Enter peer username"
					value={peer}
					onChange={(e) => setPeer(e.target.value)}
					className="px-2 py-1 rounded text-black"
				/>
			</header>
			<main className="flex-1 overflow-y-auto p-4 bg-gray-100">
				{messages.map((m, idx) => (
					<div
						key={m.messageid || idx}
						className={`mb-2 flex ${m.from === user ? 'justify-end' : 'justify-start'}`}
					>
						<div
							className={`px-4 py-2 rounded-lg max-w-xs break-words
                ${m.from === user
									? 'bg-blue-500 text-white rounded-br-none'
									: 'bg-gray-200 text-gray-800 rounded-bl-none'}`}
						>
							{m.body}
						</div>
					</div>
				))}
				<div ref={endRef} />
			</main>
			<footer className="p-4 bg-white flex">
				<input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Type your message..."
					className="flex-1 px-3 py-2 border rounded mr-2"
				/>
				<button
					onClick={sendMessage}
					className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
				>
					Send
				</button>
			</footer>
		</div>
	);
}
