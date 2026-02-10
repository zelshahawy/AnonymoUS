// src/app/chat/chatClient.tsx
'use client';

import AddContactModal from '@/components/AddContactModal';
import CommandDropdown from '@/components/CommandDropdown';
import UserProfile from '@/components/UserProfile';
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
	| { type: 'bot', payload: Message };

function messagesReducer(state: Message[], action: Action): Message[] {
	switch (action.type) {
		case 'history':
			return [...state, action.payload]
		case 'chat':
			if (state.some(m => m.messageid === action.payload.messageid)) {
				return state
			}
			return [...state, action.payload]
		case 'bot':
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
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
	const [showCommandDropdown, setShowCommandDropdown] = useState(false);
	const endRef = useRef<HTMLDivElement>(null);
	const peerRef = useRef<string>(''); // Add this ref to track current peer
	const inputRef = useRef<HTMLInputElement>(null);

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

	useEffect(() => {
		if (!currentUser) return;
		window.localStorage.setItem(`contacts_${currentUser}`, JSON.stringify(contacts));
	}, [contacts, currentUser]);

	useEffect(() => {
		if (!currentUser) return;
		const stored = window.localStorage.getItem(`unread_${currentUser}`);
		if (stored) {
			try {
				setUnreadMessages(JSON.parse(stored));
			} catch {
				setUnreadMessages({});
			}
		}
	}, [currentUser]);

	useEffect(() => {
		if (!currentUser) return;
		window.localStorage.setItem(`unread_${currentUser}`, JSON.stringify(unreadMessages));
	}, [unreadMessages, currentUser]);

	useEffect(() => {
		if (peer && unreadMessages[peer] > 0) {
			setUnreadMessages(prev => ({
				...prev,
				[peer]: 0
			}));
		}
	}, [peer]);

	const addContact = () => {
		setIsModalOpen(true);
	};

	const handleAddContact = (newUsername: string) => {
		if (!contacts.includes(newUsername)) {
			setContacts(prev => [...prev, newUsername]);
		}
	};

	// Update peer ref whenever peer changes
	useEffect(() => {
		peerRef.current = peer;
	}, [peer]);

	// Single WebSocket connection that stays open
	useEffect(() => {
		if (!currentUser || !token) return;

		const ws = new WebSocket(`${WEBSOCKETURL}?token=${encodeURIComponent(token)}`);

		ws.onopen = () => {
			console.log('WebSocket connected');
		};

		ws.onmessage = (e: MessageEvent) => {
			const msg: Message = JSON.parse(e.data);
			const currentPeer = peerRef.current;
			console.log('Received message:', msg, 'Current peer:', currentPeer);

			if (currentPeer) {
				const isRelevantMessage = (
					(msg.from === currentUser && msg.to === currentPeer) ||
					(msg.from === currentPeer && msg.to === currentUser)
				);

				if (isRelevantMessage) {
					console.log('Dispatching message for current chat:', msg);
					dispatch({ type: msg.type, payload: msg } as Action);
				}
			}

			// Handle unread messages from others (not current peer and not from self)
			if (msg.type === 'chat' && msg.from !== currentUser && msg.from !== currentPeer) {
				console.log('Adding unread message from:', msg.from);
				setUnreadMessages(prev => ({
					...prev,
					[msg.from]: (prev[msg.from] || 0) + 1
				}));

				// Add sender to contacts if not already there
				setContacts(prev => {
					if (!prev.includes(msg.from)) {
						return [...prev, msg.from];
					}
					return prev;
				});
			}
		};

		ws.onclose = () => {
			console.log('WebSocket closed');
		};

		ws.onerror = (error) => {
			console.error('WebSocket error:', error);
		};

		setSocket(ws);

		return () => {
			ws.close();
		};
	}, [currentUser, token, WEBSOCKETURL]);

	// Load history when peer changes
	useEffect(() => {
		if (peer && socket && socket.readyState === WebSocket.OPEN) {
			dispatch({ type: 'clear' });
			console.log('Loading history for peer:', peer);
			socket.send(JSON.stringify({ type: 'history', to: peer, from: currentUser }));
		}
	}, [peer, socket, currentUser]);

	useEffect(() => {
		if (peer) {
			setUnreadMessages(prev => ({
				...prev,
				[peer]: 0
			}));
		}
	}, [peer]);

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

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInput(value);

		if (value === '/') {
			setShowCommandDropdown(true);
		} else {
			setShowCommandDropdown(false);
		}
	};

	const handleCommandSelect = (command: string) => {
		setInput(command);
		setShowCommandDropdown(false);
		inputRef.current?.focus();
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Escape') {
			setShowCommandDropdown(false);
			return;
		}

		if (e.key === 'Enter') {
			e.preventDefault();
			setShowCommandDropdown(false);
			sendMessage();
		}
	};

	const parseMarkdown = (text: string) => {
		return text.split(/(\*\*.*?\*\*)/).map((part, index) => {
			if (part.startsWith('**') && part.endsWith('**')) {
				return <strong key={index}>{part.slice(2, -2)}</strong>;
			}
			return part;
		});
	};

	return (
		<>
			<style jsx global>{`
                .grecaptcha-badge {
                    display: none !important;
                }
            `}</style>

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
								className={`px-4 py-3 cursor-pointer hover:bg-[#bd93f9] hover:text-[#282a36] text-[#f8f8f2] transition-colors flex items-center justify-between ${peer === c ? 'bg-[#bd93f9] font-bold text-[#282a36]' : ''
									}`}
							>
								<span>{c}</span>
								{unreadMessages[c] > 0 && (
									<div className="bg-[#ff5555] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
										{unreadMessages[c] > 9 ? '9+' : unreadMessages[c]}
									</div>
								)}
							</div>
						))}
					</div>
				</div>

				{/* Main Chat Pane */}
				<div className="flex-1 flex flex-col">
					{/* Header */}
					<div className="px-4 py-3 bg-[#44475a] text-[#f8f8f2] flex items-center justify-between border-b-2 border-[#bd93f9]">
						<UserProfile user={currentUser} />
						<div className="flex-1 text-center">
							{peer ? (
								<span className="font-semibold">
									Chatting with <strong className="text-[#50fa7b]">{peer}</strong>
								</span>
							) : (
								<span className="text-[#f8f8f2]">Select a contact to start chatting</span>
							)}
						</div>
						<Link href="/">
							<button className="px-4 py-2 bg-[#50fa7b] text-[#282a36] rounded font-bold hover:bg-[#ff79c6] transition-colors">
								Home
							</button>
						</Link>
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
										{m.type === 'bot' ? (
											<div className="whitespace-pre-line">
												{m.body.split('\n').map((line, index) => (
													<div key={index}>
														{parseMarkdown(line)}
													</div>
												))}
											</div>
										) : (
											m.body
										)}
									</div>
								</div>
							))
						)}
						<div ref={endRef} />
					</div>

					{/* Input area */}
					<div className="p-4 bg-[#44475a] border-t-2 border-[#bd93f9] flex items-center relative">
						<div className="flex-1 relative">
							<input
								ref={inputRef}
								type="text"
								placeholder="Type a message... (/ for commands)"
								value={input}
								onChange={handleInputChange}
								onKeyDown={handleKeyDown}
								disabled={!peer}
								className="w-full border-2 border-[#bd93f9] bg-[#282a36] text-[#f8f8f2] placeholder-[#f8f8f2] rounded px-4 py-3 mr-3 focus:outline-none focus:border-[#ff79c6] transition-colors font-medium"
							/>
							<CommandDropdown
								isOpen={showCommandDropdown}
								onSelect={handleCommandSelect}
								onClose={() => setShowCommandDropdown(false)}
							/>
						</div>
						<button
							onClick={sendMessage}
							disabled={!peer}
							className="bg-[#50fa7b] text-[#282a36] px-6 py-3 rounded font-bold hover:bg-[#ff79c6] disabled:opacity-50 disabled:hover:bg-[#50fa7b] transition-colors ml-3"
						>
							Send
						</button>
					</div>
				</div>
			</div>

			<AddContactModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onAdd={handleAddContact}
				currentUser={currentUser}
			/>
		</>
	);
}
