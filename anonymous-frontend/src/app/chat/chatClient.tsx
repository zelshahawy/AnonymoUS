// src/app/chat/chatClient.tsx
'use client';

import Link from 'next/link';
import { KeyboardEvent, useEffect, useReducer, useRef, useState } from 'react';

interface Message {
	type: 'chat' | 'history';
	from: string;
	to: string;
	body: string;
	messageid: string;
}

type Action =
	| { type: 'history'; payload: Message }
	| { type: 'chat'; payload: Message }
	| { type: 'clear' };

function messagesReducer(state: Message[], action: Action): Message[] {
	switch (action.type) {
		case 'history':
			// just append—history comes in chronological order
			return [...state, action.payload]

		case 'chat':
			// guard against duplicates if server might echo twice
			if (state.some(m => m.messageid === action.payload.messageid)) {
				return state
			}
			return [...state, action.payload]

		case 'clear':
			return [];

		default:
			return state
	}
}

export default function ChatClient({ user, token }: { user: string, token: string }) {
	const currentUser = user
	const [contacts, setContacts] = useState<string[]>([]);
	const [peer, setPeer] = useState<string>('');
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const [messages, dispatch] = useReducer(messagesReducer, [] as Message[]);
	const [input, setInput] = useState<string>('');
	const endRef = useRef<HTMLDivElement>(null);
	const [showContacts, setShowContacts] = useState<boolean>(true);

	const handleSelect = (c: string) => {
		setPeer(c);
		setShowContacts(false);
	};
	// Always open "/ws" so Next.js proxies it on the same origin:
	const WEBSOCKETURL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8081/ws';

	// 1) Load contacts from localStorage (per currentUser)
	useEffect(() => {
		if (!currentUser) return;
		const stored = window.localStorage.getItem(`contacts_${currentUser}`);
		if (stored) {
			try {
				setContacts(JSON.parse(stored));
			} catch {
				setContacts([]);
			}
		}
	}, [currentUser]);

	// 2) Persist contacts whenever they change
	useEffect(() => {
		if (!currentUser) return;
		window.localStorage.setItem(`contacts_${currentUser}`, JSON.stringify(contacts));
	}, [contacts, currentUser]);

	const addContact = () => {
		const newUsername = prompt('Enter the username of the person you want to add:');
		if (newUsername && newUsername.trim() && newUsername !== currentUser) {
			if (!contacts.includes(newUsername.trim())) {
				setContacts(prev => [...prev, newUsername.trim()]);
			}
		}
	};

	// 3) Whenever peer changes, open a new WebSocket and request history.
	useEffect(() => {
		console.log("ChatClient useEffect—peer =", peer, "token =", token);
		console.log("WS URL base:", WEBSOCKETURL);

		if (!peer) {
			return;
		}
		dispatch({ type: 'clear' });
		const ws = new WebSocket(`${WEBSOCKETURL}?token=${encodeURIComponent(token)}`);
		ws.onopen = () => {
			console.log('WebSocket connected');
			ws.send(JSON.stringify({ type: 'history', to: peer, from: currentUser }));
		};
		ws.onmessage = (e: MessageEvent) => {
			const msg: Message = JSON.parse(e.data);
			dispatch({ type: msg.type, payload: msg } as Action);
		};
		ws.onclose = () => {
			console.log('WebSocket closed');
		};
		setSocket(ws);

		return () => {
			ws.close();
		};
	}, [peer]);

	useEffect(() => {
		endRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const sendMessage = () => {
		if (socket && input.trim() && peer) {
			const outgoing = {
				type: 'chat' as const,
				from: currentUser,
				to: peer,
				body: input.trim(),
			};
			socket.send(JSON.stringify(outgoing));
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
		<>
			<style jsx global>{`
				.grecaptcha-badge {
					display: none !important;
				}
			`}</style>

			<div className="flex h-screen">
				{/* Sidebar: Contacts */}
				<div
					className={`
						${showContacts ? 'block' : 'hidden'}  /* mobile: show when flag is true */
						sm:block                            /* sm+ always show */
						w-60 bg-white border-r flex flex-col
					`}
				>
					<div className="flex items-center justify-between px-4 py-3 border-b">
						<span className="font-semibold text-lg text-black">Contacts</span>
						<button
							onClick={addContact}
							className="text-white bg-blue-600 hover:bg-blue-700 rounded-full w-6 h-6 flex items-center justify-center"
							title="Add contact"
						>
							+
						</button>
					</div>
					<div className="flex-1 overflow-y-auto">
						{contacts.length === 0 && (
							<div>
								<p className="p-4 text-gray-500">No contacts. Click + to add.</p>
								<p className="p-4 text-gray-500 text-sm">
									Don&apos;t have anyone to message? Add <strong>testuser1</strong> or{' '}
									<strong>testuser2</strong> as a contact...
								</p>
							</div>
						)}
						{contacts.map((c, idx) => (
							<div
								key={idx}
								onClick={() => handleSelect(c)}
								className={`px-4 py-3 cursor-pointer hover:bg-gray-100 text-gray-600 ${peer === c ? 'bg-gray-200 font-semibold' : ''
									}`}
							>
								{c}
							</div>
						))}
					</div>
				</div>

				{/* Main Chat Pane */}
				<div
					className={`
						${showContacts ? 'hidden' : 'flex'}  /* mobile: hide when contacts are shown */
						sm:flex                             /* sm+ always show */
						flex-1 flex flex-col
					`}
				>
					{/* Header */}
					<div className="px-4 py-3 bg-blue-600 text-white flex items-center">
						{/* back‐to‐contacts on mobile */}
						<button
							onClick={() => setShowContacts(true)}
							className="sm:hidden mr-4 text-white"
						>
							<strong>←</strong> Contacts
						</button>

						<div className="flex-1">
							{peer ? (
								<span>Chatting with <strong>{peer}</strong></span>
							) : (
								<span className="text-gray-200">Select a contact to start chatting</span>
							)}
						</div>

						<div className="flex space-x-2">
							<Link href="/">
								<button className="px-3 py-1 bg-white text-blue-600 rounded hover:bg-gray-100">
									Home
								</button>
							</Link>
							<Link href="/logout">
								<button className="px-3 py-1 bg-white text-blue-600 rounded hover:bg-gray-100">
									Logout
								</button>
							</Link>
						</div>
					</div>

					{/* Messages */}
					<div className="flex-1 overflow-y-auto p-4 bg-gray-50">
						{!peer ? (
							<p className="text-gray-500">No chat selected.</p>
						) : (
							messages.map((m) => (
								<div
									key={m.messageid}
									className={`mb-2 flex ${m.from === currentUser ? 'justify-end' : 'justify-start'
										}`}
								>
									<div
										className={`px-4 py-2 rounded-lg max-w-xs break-words ${m.from === currentUser
											? 'bg-blue-500 text-white rounded-br-none'
											: 'bg-gray-200 text-gray-800 rounded-bl-none'
											}`}
									>
										{m.body}
									</div>
								</div>
							))
						)}
						<div ref={endRef} />
					</div>

					{/* Input */}
					<div className="p-4 bg-white border-t flex items-center">
						<input
							type="text"
							placeholder="Type a message..."
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							disabled={!peer}
							className="flex-1 border border-black rounded px-3 py-2 mr-2 focus:outline-none focus:ring text-black"
						/>
						<button
							onClick={sendMessage}
							disabled={!peer}
							className="bg-blue-600 text-black px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
						>
							Send
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
