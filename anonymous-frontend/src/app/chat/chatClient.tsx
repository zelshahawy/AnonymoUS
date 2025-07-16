// src/app/chat/chatClient.tsx
'use client';

import Link from 'next/link';
import { KeyboardEvent, useEffect, useReducer, useRef, useState } from 'react';

interface Message {
	type: 'chat' | 'history' | 'bot';
	from: string;
	to: string;
	body: string;
	messageid: string;
}

type Action =
	| { type: 'history'; payload: Message }
	| { type: 'chat'; payload: Message }
	| { type: 'clear' }
	| { type: 'bot'; payload: Message };

function messagesReducer(state: Message[], action: Action): Message[] {
	switch (action.type) {
		case 'history':
			return [...state, action.payload]
		case 'chat':
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

	const WEBSOCKETURL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080/ws';

	// Load contacts from localStorage
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

	// Persist contacts
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

	// WebSocket connection
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
			if (!peer) {
				window.location.href = '/home';
			}
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

			{/* Strong Dracula: #282a36 (background), #44475a (current line), #bd93f9 (purple), #ff79c6 (pink), #50fa7b (green), #ff5555 (red), #f8f8f2 (foreground) */}
			<div className="flex h-screen bg-[#282a36]">
				{/* Sidebar: Contacts */}
				<div className="w-60 bg-[#44475a] border-r-4 border-[#bd93f9] flex flex-col shadow-lg">
					<div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#bd93f9] bg-[#282a36]">
						<span className="font-bold text-lg text-[#f8f8f2]">Contacts</span>
						<button
							onClick={addContact}
							className="text-[#282a36] bg-[#bd93f9] hover:bg-[#ff79c6] rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors"
							title="Add contact"
						>
							+
						</button>
					</div>
					<div className="flex-1 overflow-y-auto">
						<p className="p-4 text-[#bd93f9] font-semibold">Your username: {currentUser}</p>
						{contacts.length === 0 && (
							<div>
								<p className="p-4 text-[#f8f8f2]">No contacts. Click + to add.</p>
								<p className="p-4 text-[#f8f8f2] text-sm">
									Don&apos;t have anyone to message? Add <strong className="text-[#50fa7b]">testuser1</strong> or <strong className="text-[#50fa7b]">testuser2</strong> as a contact, then log in there to see and send messages.
									Be careful though because all data for the testusers are deleted when you log out. You should use incognito mode for testing.
								</p>
							</div>
						)}
						{contacts.map((c, idx) => (
							<div
								key={idx}
								onClick={() => setPeer(c)}
								className={`px-4 py-3 cursor-pointer hover:bg-[#bd93f9] hover:text-[#282a36] text-[#f8f8f2] transition-colors ${peer === c ? 'bg-[#bd93f9] font-bold text-[#282a36]' : ''
									}`}
							>
								{c}
							</div>
						))}
					</div>
				</div>

				{/* Main Chat Pane */}
				<div className="flex-1 flex flex-col">
					{/* Header */}
					<div className="px-4 py-3 bg-[#44475a] text-[#f8f8f2] flex items-center border-b-2 border-[#bd93f9]">
						<div className="flex-1">
							{peer ? (
								<span className="font-semibold">
									Chatting with <strong className="text-[#50fa7b]">{peer}</strong>
								</span>
							) : (
								<span className="text-[#f8f8f2]">Select a contact to start chatting</span>
							)}
						</div>
						<div className="flex space-x-2">
							<Link href="/">
								<button className="px-4 py-2 bg-[#50fa7b] text-[#282a36] rounded font-bold hover:bg-[#ff79c6] transition-colors">
									Home
								</button>
							</Link>
							<Link href="/logout">
								<button className="px-4 py-2 bg-[#ff5555] text-[#f8f8f2] rounded font-bold hover:bg-[#ff79c6] transition-colors">
									Logout
								</button>
							</Link>
						</div>
					</div>

					{/* Messages area */}
					<div className="flex-1 overflow-y-auto p-4 bg-[#282a36]">
						{!peer ? (
							<p className="text-[#f8f8f2] text-center">No chat selected.</p>
						) : (
							messages.map((m) => (
								<div
									key={m.messageid}
									className={`mb-3 flex ${m.from === currentUser ? 'justify-end' : 'justify-start'}`}
								>
									<div
										className={`px-4 py-3 rounded-lg max-w-xs break-words font-medium ${m.from === currentUser
												? 'bg-[#bd93f9] text-[#282a36] rounded-br-none'
												: 'bg-[#44475a] text-[#f8f8f2] rounded-bl-none border-2 border-[#bd93f9]'
											}`}
									>
										{m.body}
									</div>
								</div>
							))
						)}
						<div ref={endRef} />
					</div>

					{/* Input area */}
					<div className="p-4 bg-[#44475a] border-t-2 border-[#bd93f9] flex items-center">
						<input
							type="text"
							placeholder="Type a message..."
							value={input}
							onChange={e => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							disabled={!peer}
							className="flex-1 border-2 border-[#bd93f9] bg-[#282a36] text-[#f8f8f2] placeholder-[#f8f8f2] rounded px-4 py-3 mr-3 focus:outline-none focus:border-[#ff79c6] transition-colors font-medium"
						/>
						<button
							onClick={sendMessage}
							disabled={!peer}
							className="bg-[#50fa7b] text-[#282a36] px-6 py-3 rounded font-bold hover:bg-[#ff79c6] disabled:opacity-50 disabled:hover:bg-[#50fa7b] transition-colors"
						>
							Send
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
