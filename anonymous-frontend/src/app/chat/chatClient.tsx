// src/app/chat/chatClient.tsx
'use client';

import { KeyboardEvent, useEffect, useRef, useState } from 'react';

interface Message {
	type: 'chat' | 'history';
	from: string;
	to: string;
	body: string;
	messageid: string;
}

export default function ChatClient({ user }: { user: string }) {
	const currentUser = user
	const [contacts, setContacts] = useState<string[]>([]);
	const [peer, setPeer] = useState<string>('');
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [input, setInput] = useState<string>('');
	const endRef = useRef<HTMLDivElement>(null);

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
		if (socket) {
			socket.close();
			setSocket(null);
		}
		setMessages([]);

		if (!peer) {
			return;
		}

		const ws = new WebSocket(WEBSOCKETURL);
		ws.onopen = () => {
			// Ask server for history between currentUser and peer
			ws.send(JSON.stringify({ type: 'history', to: peer, from: currentUser }));
		};
		ws.onmessage = (e: MessageEvent) => {
			const msg: Message = JSON.parse(e.data);
			setMessages(prev => [...prev, msg]);
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
          position: fixed !important;
          bottom: auto !important;
					top: 0 !important;
        }
      `}</style>
			<div className="flex h-screen">
				{/* Sidebar: Contacts */}
				<div className="w-60 bg-white border-r flex flex-col">
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
							<p className="p-4 text-gray-500">No contacts. Click + to add.</p>
						)}
						{contacts.map((c, idx) => (
							<div
								key={idx}
								onClick={() => setPeer(c)}
								className={`px-4 py-3 cursor-pointer hover:bg-gray-100 text-gray-600 ${peer === c ? 'bg-gray-200 font-semibold' : ''
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
					<div className="px-4 py-3 bg-blue-600 text-white">
						{peer ? (
							<span>
								Chatting with <strong>{peer}</strong>
							</span>
						) : (
							<span className="text-gray-200">Select a contact to start chatting</span>
						)}
					</div>

					{/* Messages area */}
					<div className="flex-1 overflow-y-auto p-4 bg-gray-50">
						{!peer ? (
							<p className="text-gray-500">No chat selected.</p>
						) : (
							messages.map((m, i) => (
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

					{/* Input area */}
					<div className="p-4 bg-white border-t flex items-center">
						<input
							type="text"
							placeholder="Type a message..."
							value={input}
							onChange={e => setInput(e.target.value)}
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
