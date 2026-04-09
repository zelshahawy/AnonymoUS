// src/app/chat/chatClient.tsx
'use client';

import AddContactModal from '@/components/AddContactModal';
import CommandDropdown, { COMMANDS } from '@/components/CommandDropdown';
import UserProfile from '@/components/UserProfile';
import Link from 'next/link';
import { KeyboardEvent, useEffect, useReducer, useRef, useState } from 'react';

interface Message {
	type: 'chat' | 'history' | 'bot' | 'notification';
	from: string;
	to: string;
	body: string;
	messageid: string;
	count?: number;
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

const normalizeUsername = (value: string) => value.trim().toLowerCase();

const isSameUser = (left: string, right: string) => normalizeUsername(left) === normalizeUsername(right);

const hasContact = (list: string[], username: string) => {
	const normalizedCandidate = normalizeUsername(username);
	return list.some(contact => normalizeUsername(contact) === normalizedCandidate);
};

const dedupeContactsCaseInsensitive = (list: string[]) => {
	const seen = new Set<string>();
	const deduped: string[] = [];

	for (const rawName of list) {
		const trimmedName = rawName.trim();
		if (!trimmedName) continue;

		const normalizedName = normalizeUsername(trimmedName);
		if (seen.has(normalizedName)) continue;

		seen.add(normalizedName);
		deduped.push(trimmedName);
	}

	return deduped;
};

const normalizeUnreadMap = (rawMap: Record<string, number>) => {
	const normalizedMap: Record<string, number> = {};

	for (const [key, value] of Object.entries(rawMap)) {
		const normalizedKey = normalizeUsername(key);
		if (!normalizedKey) continue;
		const count = Number.isFinite(value) ? value : 0;
		normalizedMap[normalizedKey] = (normalizedMap[normalizedKey] || 0) + count;
	}

	return normalizedMap;
};

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
	const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
	const endRef = useRef<HTMLDivElement>(null);
	const peerRef = useRef<string>('');
	const inputRef = useRef<HTMLInputElement>(null);

	const WEBSOCKETURL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080/ws';

	// Load contacts from localStorage
	useEffect(() => {
		if (!currentUser) return;
		const stored = window.localStorage.getItem(`contacts_${currentUser}`);
		let loadedContacts: string[] = [];

		if (stored) {
			try {
				const parsed = JSON.parse(stored) as unknown;
				if (Array.isArray(parsed)) {
					loadedContacts = parsed.filter((entry): entry is string => typeof entry === 'string');
				}
			} catch {
				loadedContacts = [];
			}
		}

		const testUsers = ['testuser1', 'testuser2'].filter(u => !isSameUser(u, currentUser));
		const mergedContacts = dedupeContactsCaseInsensitive([...loadedContacts, ...testUsers]);

		setContacts(mergedContacts);
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
				const parsed = JSON.parse(stored) as unknown;
				if (parsed && typeof parsed === 'object') {
					setUnreadMessages(normalizeUnreadMap(parsed as Record<string, number>));
					return;
				}
			} catch {
				// Keep fallback below.
			}
		}
		setUnreadMessages({});
	}, [currentUser]);

	useEffect(() => {
		if (!currentUser) return;
		window.localStorage.setItem(`unread_${currentUser}`, JSON.stringify(unreadMessages));
	}, [unreadMessages, currentUser]);

	useEffect(() => {
		if (!peer) return;
		const peerKey = normalizeUsername(peer);
		if (!peerKey || unreadMessages[peerKey] === 0) return;

		setUnreadMessages(prev => ({
			...prev,
			[peerKey]: 0,
		}));
	}, [peer, unreadMessages]);

	const addContact = () => {
		setIsModalOpen(true);
	};

	const handleAddContact = (newUsername: string) => {
		const trimmedUsername = newUsername.trim();
		if (!trimmedUsername) return;

		setContacts(prev => {
			if (hasContact(prev, trimmedUsername)) {
				return prev;
			}
			return [...prev, trimmedUsername];
		});
	};

	useEffect(() => {
		peerRef.current = peer;
	}, [peer]);

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

			if (msg.type === 'notification') {
				const senderKey = normalizeUsername(msg.from);
				const unreadIncrement =
					typeof msg.count === 'number' && Number.isFinite(msg.count) && msg.count > 0
						? msg.count
						: 1;

				if (!isSameUser(msg.from, currentPeer)) {
					setUnreadMessages(prev => ({
						...prev,
						[senderKey]: (prev[senderKey] || 0) + unreadIncrement,
					}));
				}

				setContacts(prev => {
					if (!hasContact(prev, msg.from)) {
						return [...prev, msg.from.trim()];
					}
					return prev;
				});
				return;
			}

			if (currentPeer) {
				const isRelevantMessage = (
					(isSameUser(msg.from, currentUser) && isSameUser(msg.to, currentPeer)) ||
					(isSameUser(msg.from, currentPeer) && isSameUser(msg.to, currentUser))
				);

				if (isRelevantMessage) {
					dispatch({ type: msg.type, payload: msg } as Action);
				}
			}

			if (msg.type === 'chat' && !isSameUser(msg.from, currentUser) && !isSameUser(msg.from, currentPeer)) {
				console.log('Adding unread message from:', msg.from);
				const senderKey = normalizeUsername(msg.from);
				setUnreadMessages(prev => ({
					...prev,
					[senderKey]: (prev[senderKey] || 0) + 1,
				}));

				// Add sender to contacts if not already there
				setContacts(prev => {
					if (!hasContact(prev, msg.from)) {
						return [...prev, msg.from.trim()];
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

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInput(value);

		if (value === '/') {
			setShowCommandDropdown(true);
			setSelectedCommandIndex(0);
		} else {
			setShowCommandDropdown(false);
		}
	};

	const handleCommandSelect = (command: string) => {
		setInput(command);
		setShowCommandDropdown(false);
		setSelectedCommandIndex(0);
		inputRef.current?.focus();
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (showCommandDropdown && COMMANDS.length > 0) {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				setSelectedCommandIndex((prev) => (prev + 1) % COMMANDS.length);
				return;
			}

			if (e.key === 'ArrowUp') {
				e.preventDefault();
				setSelectedCommandIndex((prev) => (prev - 1 + COMMANDS.length) % COMMANDS.length);
				return;
			}

			if (e.key === 'Enter') {
				e.preventDefault();
				handleCommandSelect(COMMANDS[selectedCommandIndex].command);
				return;
			}
		}

		if (e.key === 'Escape') {
			setShowCommandDropdown(false);
			setSelectedCommandIndex(0);
			return;
		}

		if (e.key === 'Enter') {
			e.preventDefault();
			setShowCommandDropdown(false);
			setSelectedCommandIndex(0);
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

			<div className="flex h-screen overflow-hidden bg-[#282a36]">
				{/* Sidebar: Contacts */}
				<div className={`${peer ? 'hidden' : 'flex'} md:flex w-full md:w-60 md:shrink-0 bg-[#44475a] border-r-0 md:border-r-4 border-[#bd93f9] flex-col shadow-lg`}>
					<div className="sticky top-0 z-20 border-b-2 border-[#bd93f9] bg-[#282a36]">
						<div className="flex items-center justify-between px-4 py-3">
							<span className="font-bold text-lg text-[#f8f8f2]">Contacts</span>
							<button
								onClick={addContact}
								className="text-[#282a36] bg-[#bd93f9] hover:bg-[#ff79c6] rounded-full w-8 h-8 flex items-center justify-center font-bold transition-colors"
								title="Add contact"
							>
								+
							</button>
						</div>
						<p className="px-4 pb-3 text-[#bd93f9] font-semibold">Your username: {currentUser}</p>
					</div>
					<div className="flex-1 overflow-y-auto">
						{contacts.map((c, idx) => {
							const unreadCount = unreadMessages[normalizeUsername(c)] || 0;
							return (
								<div
									key={`${c}-${idx}`}
									onClick={() => setPeer(c)}
									className={`px-4 py-3 cursor-pointer hover:bg-[#bd93f9] hover:text-[#282a36] text-[#f8f8f2] transition-colors flex items-center justify-between border-b border-[#6272a4] ${peer === c ? 'bg-[#bd93f9] font-bold text-[#282a36]' : ''
										}`}
								>
									<div className="flex items-center gap-3 min-w-0">
										<div className="w-10 h-10 rounded-full bg-[#282a36] border border-[#bd93f9] text-[#bd93f9] flex items-center justify-center font-bold text-xs shrink-0">
											{c.slice(0, 2).toUpperCase()}
										</div>
										<span className="truncate">{c}</span>
									</div>
									{unreadCount > 0 && (
										<div className="bg-[#ff5555] text-white text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-bold">
											{unreadCount > 9 ? '9+' : unreadCount}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Main Chat Pane */}
				<div className={`${peer ? 'flex' : 'hidden'} md:flex flex-1 min-w-0 flex-col`}>
					{/* Header */}
					<div className="sticky top-0 z-20 px-3 py-3 md:px-4 md:py-3 bg-[#44475a] text-[#f8f8f2] flex items-center gap-2 md:gap-0 justify-between border-b-2 border-[#bd93f9]">
						<div className="flex items-center gap-2">
							{peer && (
								<button
									onClick={() => setPeer('')}
									className="md:hidden px-3 py-2 bg-[#282a36] text-[#f8f8f2] rounded font-bold hover:bg-[#bd93f9] hover:text-[#282a36] transition-colors"
									title="Back to contacts"
								>
									Back
								</button>
							)}
							<Link href="/" className="hidden md:block">
								<button className="px-4 py-2 bg-[#50fa7b] text-[#282a36] rounded font-bold hover:bg-[#ff79c6] transition-colors">
									Home
								</button>
							</Link>
						</div>
						<div className="flex-1 text-center">
							{peer ? (
								<span className="font-semibold">
									Chatting with <strong className="text-[#50fa7b]">{peer}</strong>
								</span>
							) : (
								<span className="text-[#f8f8f2]">Select a contact to start chatting</span>
							)}
						</div>
						<UserProfile user={currentUser} />
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
										className={`px-4 py-3 rounded-lg max-w-xs wrap-break-word font-medium ${m.from === currentUser
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
					<div className="sticky bottom-0 z-20 p-3 md:p-4 bg-[#44475a] border-t-2 border-[#bd93f9] flex items-center relative">
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
								onClose={() => {
									setShowCommandDropdown(false);
									setSelectedCommandIndex(0);
								}}
								selectedIndex={selectedCommandIndex}
							/>
						</div>
						<button
							onClick={sendMessage}
							disabled={!peer}
							className="bg-[#50fa7b] text-[#282a36] px-4 md:px-6 py-3 rounded font-bold hover:bg-[#ff79c6] disabled:opacity-50 disabled:hover:bg-[#50fa7b] transition-colors ml-3"
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
