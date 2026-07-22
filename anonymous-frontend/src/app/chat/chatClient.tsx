// src/app/chat/chatClient.tsx
'use client';

import AddContactModal from '@/components/AddContactModal';
import CommandDropdown, { COMMANDS } from '@/components/CommandDropdown';
import StockChart, { isChartData, parseChartData } from '@/components/StockChart';
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

			<div className="flex h-screen overflow-hidden bg-[#1a1b23] text-[#f8f8f2]">
				{/* Sidebar: Contacts */}
				<div className={`${peer ? 'hidden' : 'flex'} md:flex w-full md:w-72 md:shrink-0 bg-[#21222c] border-r border-[#33354a] flex-col`}>
					<div className="sticky top-0 z-20 bg-[#21222c] border-b border-[#33354a]">
						<div className="flex items-center justify-between px-5 pt-5 pb-3">
							<span className="font-bold text-lg tracking-tight text-[#f8f8f2]">Messages</span>
							<button
								onClick={addContact}
								className="text-[#bd93f9] bg-[#bd93f9]/10 hover:bg-[#bd93f9]/20 rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none transition-colors"
								title="Add contact"
							>
								+
							</button>
						</div>
						<div className="flex items-center gap-2 px-5 pb-4">
							<span className="w-2 h-2 rounded-full bg-[#50fa7b] shadow-[0_0_6px_#50fa7b]" />
							<p className="text-sm text-[#8b8fa3] truncate">
								Signed in as <span className="text-[#f8f8f2] font-medium">{currentUser}</span>
							</p>
						</div>
					</div>
					<div className="flex-1 overflow-y-auto px-2 py-2">
						{contacts.map((c, idx) => {
							const unreadCount = unreadMessages[normalizeUsername(c)] || 0;
							const active = peer === c;
							return (
								<div
									key={`${c}-${idx}`}
									onClick={() => setPeer(c)}
									className={`group px-3 py-2.5 mb-1 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${active ? 'bg-[#bd93f9]/15' : 'hover:bg-[#2a2c39]'
										}`}
								>
									<div className="flex items-center gap-3 min-w-0">
										<div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${active
											? 'bg-[#bd93f9] text-[#21222c]'
											: 'bg-[#2f3142] text-[#bd93f9] group-hover:bg-[#363850]'
											}`}>
											{c.slice(0, 2).toUpperCase()}
										</div>
										<span className={`truncate ${active ? 'text-[#f8f8f2] font-semibold' : 'text-[#c9ccd6]'}`}>{c}</span>
									</div>
									{unreadCount > 0 && (
										<div className="bg-[#ff5555] text-white text-xs rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center font-bold shrink-0">
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
					<div className="sticky top-0 z-20 px-3 py-3 md:px-5 bg-[#21222c]/95 backdrop-blur text-[#f8f8f2] flex items-center gap-2 justify-between border-b border-[#33354a]">
						<div className="flex items-center gap-2 md:gap-3 min-w-0">
							{peer && (
								<button
									onClick={() => setPeer('')}
									className="md:hidden w-9 h-9 flex items-center justify-center bg-[#2a2c39] text-[#f8f8f2] rounded-full hover:bg-[#33354a] transition-colors"
									title="Back to contacts"
								>
									‹
								</button>
							)}
							<Link href="/" className="hidden md:block">
								<button className="px-3.5 py-1.5 text-sm text-[#c9ccd6] bg-[#2a2c39] rounded-lg hover:bg-[#33354a] hover:text-[#f8f8f2] transition-colors">
									← Home
								</button>
							</Link>
							{peer && (
								<div className="flex items-center gap-3 min-w-0 md:ml-1">
									<div className="w-9 h-9 rounded-full bg-[#2f3142] text-[#bd93f9] flex items-center justify-center font-bold text-xs shrink-0">
										{peer.slice(0, 2).toUpperCase()}
									</div>
									<div className="min-w-0">
										<div className="font-semibold leading-tight truncate">{peer}</div>
										<div className="flex items-center gap-1.5 text-xs text-[#50fa7b] leading-tight">
											<span className="w-1.5 h-1.5 rounded-full bg-[#50fa7b]" /> online
										</div>
									</div>
								</div>
							)}
							{!peer && (
								<span className="hidden md:inline text-[#8b8fa3]">Select a contact to start chatting</span>
							)}
						</div>
						<UserProfile user={currentUser} />
					</div>

					{/* Messages area */}
					<div className="flex-1 overflow-y-auto px-3 md:px-6 py-5 bg-[#1a1b23] bg-[radial-gradient(circle_at_top,_#22232f_0%,_#1a1b23_60%)]">
						{!peer ? (
							<div className="h-full flex flex-col items-center justify-center text-center gap-3">
								<div className="w-16 h-16 rounded-2xl bg-[#21222c] border border-[#33354a] flex items-center justify-center text-2xl">💬</div>
								<p className="text-[#8b8fa3]">No conversation selected.</p>
								<p className="text-[#5c6070] text-sm">Pick a contact on the left to begin.</p>
							</div>
						) : (
							messages.map((m) => {
								const isMe = m.from === currentUser;
								const isBot = m.type === 'bot';
								const isChart = isBot && isChartData(m.body);
								const base = 'max-w-[80%] md:max-w-md break-words leading-relaxed shadow-sm';
								const bubbleClass = isChart
									? `${base} bg-[#21222c] ring-1 ring-[#33354a] rounded-2xl p-3`
									: isBot
										? `${base} bg-[#21222c] ring-1 ring-[#33354a] rounded-2xl px-4 py-2.5 text-[#e4e6ee]`
										: isMe
											? `${base} bg-[#bd93f9] text-[#21222c] rounded-2xl rounded-br-md px-4 py-2.5 font-medium`
											: `${base} bg-[#2f3142] text-[#f8f8f2] rounded-2xl rounded-bl-md px-4 py-2.5`;
								return (
									<div
										key={m.messageid}
										className={`mb-2.5 flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
									>
										{!isMe && (
											<div className="w-7 h-7 rounded-full bg-[#2f3142] text-[#bd93f9] flex items-center justify-center font-bold text-[10px] shrink-0 mb-0.5">
												{m.from.slice(0, 2).toUpperCase()}
											</div>
										)}
										<div className={bubbleClass}>
											{isChart ? (
												(() => {
													const chart = parseChartData(m.body);
													return chart ? <StockChart data={chart} /> : <span>Failed to load chart</span>;
												})()
											) : isBot ? (
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
								);
							})
						)}
						<div ref={endRef} />
					</div>

					{/* Input area */}
					<div className="sticky bottom-0 z-20 px-3 md:px-6 py-3 md:py-4 bg-[#21222c] border-t border-[#33354a] flex items-center gap-3">
						<div className="flex-1 relative">
							<input
								ref={inputRef}
								type="text"
								placeholder="Type a message…  ( / for commands )"
								value={input}
								onChange={handleInputChange}
								onKeyDown={handleKeyDown}
								disabled={!peer}
								className="w-full bg-[#2a2c39] text-[#f8f8f2] placeholder-[#6b6f80] rounded-full px-5 py-3 border border-transparent focus:outline-none focus:border-[#bd93f9] focus:bg-[#2f3142] transition-colors disabled:opacity-50"
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
							disabled={!peer || !input.trim()}
							className="bg-[#bd93f9] text-[#21222c] w-12 h-12 shrink-0 rounded-full font-bold flex items-center justify-center hover:bg-[#caa5fb] disabled:opacity-40 disabled:hover:bg-[#bd93f9] transition-colors"
							title="Send"
						>
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
								<path d="M22 2 11 13" />
								<path d="M22 2 15 22 11 13 2 9 22 2Z" />
							</svg>
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
