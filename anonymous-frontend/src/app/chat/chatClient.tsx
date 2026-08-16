'use client';

import CommandDropdown, { COMMANDS } from '@/components/CommandDropdown';
import StockChart, { isChartData, parseChartData } from '@/components/StockChart';
import UserProfile from '@/components/UserProfile';
import { DEMO_USERS, isSameUser, normalizeUsername } from '@/lib/users';
import Link from 'next/link';
import { Fragment, KeyboardEvent, useEffect, useReducer, useRef, useState } from 'react';

interface Message {
	type: 'chat' | 'history' | 'bot' | 'notification' | 'presence' | 'clear';
	from: string;
	to: string;
	body: string;
	messageid: string;
	count?: number;
	ts?: number;
}

type ConnectionStatus = 'connecting' | 'open' | 'reconnecting';

const formatTime = (ts?: number) =>
	ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

const dayLabel = (ts: number) => {
	const date = new Date(ts);
	const today = new Date();
	const yesterday = new Date();
	yesterday.setDate(today.getDate() - 1);

	if (date.toDateString() === today.toDateString()) return 'Today';
	if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
	return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
};

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
	const [showAddContact, setShowAddContact] = useState(false);
	const [newContactName, setNewContactName] = useState('');
	const [addContactError, setAddContactError] = useState('');
	const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
	const [showCommandDropdown, setShowCommandDropdown] = useState(false);
	const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
	const [presence, setPresence] = useState<Record<string, 'online' | 'offline'>>({});
	const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
	const [contactSearch, setContactSearch] = useState('');
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
	const endRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const stickToBottomRef = useRef<boolean>(true);
	const peerRef = useRef<string>('');
	const inputRef = useRef<HTMLInputElement>(null);

	const commandQuery = input.startsWith('/') ? input.toLowerCase() : '';
	const filteredCommands = commandQuery
		? COMMANDS.filter(cmd => cmd.command.toLowerCase().startsWith(commandQuery))
		: [];
	const commandMenuOpen = showCommandDropdown && filteredCommands.length > 0;

	const visibleContacts = contacts.filter(contact =>
		contact.toLowerCase().includes(contactSearch.trim().toLowerCase())
	);

	const WEBSOCKETURL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080/ws';

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

		const testUsers = DEMO_USERS.filter(u => !isSameUser(u, currentUser));
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
				// falls through to the default below
			}
		}
		setUnreadMessages({});
	}, [currentUser]);

	useEffect(() => {
		if (!currentUser) return;
		window.localStorage.setItem(`unread_${currentUser}`, JSON.stringify(unreadMessages));
	}, [unreadMessages, currentUser]);

	useEffect(() => {
		setSidebarCollapsed(window.localStorage.getItem('sidebar_collapsed') === '1');
	}, []);

	const toggleSidebar = () => {
		setSidebarCollapsed(prev => {
			window.localStorage.setItem('sidebar_collapsed', prev ? '0' : '1');
			return !prev;
		});
		setContactSearch('');
	};

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
		if (sidebarCollapsed) {
			toggleSidebar();
			setShowAddContact(true);
		} else {
			setShowAddContact(prev => !prev);
		}
		setNewContactName('');
		setAddContactError('');
	};

	const closeAddContact = () => {
		setShowAddContact(false);
		setNewContactName('');
		setAddContactError('');
	};

	const submitNewContact = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = newContactName.trim();
		if (!trimmed) {
			setAddContactError('Enter a username');
			return;
		}
		if (isSameUser(trimmed, currentUser)) {
			setAddContactError("You can't add yourself");
			return;
		}

		// Preserve existing casing if already a contact.
		const existing = contacts.find(contact => isSameUser(contact, trimmed));
		if (!existing) {
			setContacts(prev => [...prev, trimmed]);
		}
		setPeer(existing ?? trimmed);
		closeAddContact();
	};

	const removeContact = (name: string) => {
		setContacts(prev => prev.filter(contact => !isSameUser(contact, name)));
		setUnreadMessages(prev => {
			const next = { ...prev };
			delete next[normalizeUsername(name)];
			return next;
		});
		if (isSameUser(peer, name)) setPeer('');
	};

	const handleListScroll = () => {
		const el = listRef.current;
		if (!el) return;
		stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
	};

	useEffect(() => {
		peerRef.current = peer;
	}, [peer]);

	useEffect(() => {
		if (!currentUser || !token) return;

		let stopped = false;
		let ws: WebSocket | null = null;
		let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
		let attempts = 0;

		const connect = () => {
			if (stopped) return;
			setConnectionStatus(attempts === 0 ? 'connecting' : 'reconnecting');
			ws = new WebSocket(`${WEBSOCKETURL}?token=${encodeURIComponent(token)}`);

			ws.onopen = () => {
				attempts = 0;
				setConnectionStatus('open');
				// Fires on reconnect too, so resync whatever conversation is open.
				const activePeer = peerRef.current;
				if (activePeer && ws) {
					dispatch({ type: 'clear' });
					ws.send(JSON.stringify({ type: 'history', to: activePeer, from: currentUser }));
					ws.send(JSON.stringify({ type: 'presence', to: activePeer, from: currentUser }));
				}
			};

			ws.onmessage = (e: MessageEvent) => {
				const msg: Message = JSON.parse(e.data);
				const currentPeer = peerRef.current;

				if (msg.type === 'presence') {
					setPresence(prev => ({
						...prev,
						[normalizeUsername(msg.from)]: msg.body === 'online' ? 'online' : 'offline',
					}));
					return;
				}

				if (msg.type === 'clear') {
					const otherParty = isSameUser(msg.from, currentUser) ? msg.to : msg.from;
					if (currentPeer && isSameUser(otherParty, currentPeer)) {
						dispatch({ type: 'clear' });
					}
					const clearedKey = normalizeUsername(otherParty);
					setUnreadMessages(prev =>
						clearedKey in prev ? { ...prev, [clearedKey]: 0 } : prev
					);
					return;
				}

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

				setContacts(prev => {
					if (!hasContact(prev, msg.from)) {
						return [...prev, msg.from.trim()];
					}
					return prev;
				});
			}
		};

			ws.onerror = () => {
				ws?.close();
			};

			ws.onclose = () => {
				if (stopped) return;
				setSocket(null);
				setConnectionStatus('reconnecting');
				const delay = Math.min(15000, 1000 * 2 ** attempts);
				attempts += 1;
				reconnectTimer = setTimeout(connect, delay);
			};

			setSocket(ws);
		};

		connect();

		return () => {
			stopped = true;
			if (reconnectTimer) clearTimeout(reconnectTimer);
			ws?.close();
		};
	}, [currentUser, token, WEBSOCKETURL]);

	useEffect(() => {
		if (peer && socket && socket.readyState === WebSocket.OPEN) {
			dispatch({ type: 'clear' });
			socket.send(JSON.stringify({ type: 'history', to: peer, from: currentUser }));
			socket.send(JSON.stringify({ type: 'presence', to: peer, from: currentUser }));
		}
	}, [peer, socket, currentUser]);

	// Keep the view pinned to the newest message only when already at the bottom.
	useEffect(() => {
		stickToBottomRef.current = true;
	}, [peer]);

	useEffect(() => {
		if (stickToBottomRef.current) {
			endRef.current?.scrollIntoView({ behavior: 'auto' });
		}
	}, [messages]);

	const sendMessage = () => {
		if (!socket || !peer) return;
		const text = input.trim();
		if (!text) return;

		// /clear is a local command, not a chat message.
		if (text.toLowerCase() === '/clear') {
			dispatch({ type: 'clear' });
			socket.send(JSON.stringify({ type: 'clear', to: peer, from: currentUser }));
			setInput('');
			return;
		}

		const outgoing = {
			type: 'chat' as const,
			from: currentUser,
			to: peer,
			body: text,
		};
		socket.send(JSON.stringify(outgoing));
		setInput('');
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInput(value);
		setShowCommandDropdown(value.startsWith('/'));
		setSelectedCommandIndex(0);
	};

	const handleCommandSelect = (command: string) => {
		setInput(command);
		setShowCommandDropdown(false);
		setSelectedCommandIndex(0);
		inputRef.current?.focus();
	};

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (commandMenuOpen) {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				setSelectedCommandIndex((prev) => (prev + 1) % filteredCommands.length);
				return;
			}

			if (e.key === 'ArrowUp') {
				e.preventDefault();
				setSelectedCommandIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
				return;
			}

			if (e.key === 'Enter') {
				e.preventDefault();
				handleCommandSelect(filteredCommands[selectedCommandIndex].command);
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
				<div className={`${peer ? 'hidden' : 'flex'} md:flex w-full ${sidebarCollapsed ? 'md:w-[4.5rem]' : 'md:w-72'} md:shrink-0 md:transition-[width] md:duration-200 bg-[#21222c] border-r border-[#33354a] flex-col`}>
					<div className="sticky top-0 z-20 bg-[#21222c] border-b border-[#33354a]">
						<div className={`flex items-center justify-between px-5 pt-5 pb-3 ${sidebarCollapsed ? 'md:flex-col md:justify-start md:gap-2.5 md:px-0' : ''}`}>
							<div className={`flex items-center gap-2.5 min-w-0 ${sidebarCollapsed ? 'md:hidden' : ''}`}>
								<Link
									href="/"
									className="md:hidden text-[#c9ccd6] hover:text-[#f8f8f2] transition-colors shrink-0"
									title="Home"
									aria-label="Home"
								>
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<path d="M3 10.5 12 3l9 7.5" />
										<path d="M5 9.5V21h14V9.5" />
									</svg>
								</Link>
								<span className="font-bold text-lg tracking-tight text-[#f8f8f2]">Messages</span>
							</div>
							<div className={`flex items-center gap-1.5 ${sidebarCollapsed ? 'md:flex-col md:gap-2.5' : ''}`}>
								<button
									onClick={addContact}
									className="text-[#bd93f9] bg-[#bd93f9]/10 hover:bg-[#bd93f9]/20 rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none transition-colors"
									title="Add contact"
								>
									+
								</button>
								<button
									onClick={toggleSidebar}
									className="hidden md:flex text-[#6b6f80] hover:text-[#f8f8f2] hover:bg-[#2a2c39] rounded-full w-8 h-8 items-center justify-center transition-colors"
									title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
									aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
								>
									<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
										{sidebarCollapsed ? (
											<>
												<path d="m6 17 5-5-5-5" />
												<path d="m13 17 5-5-5-5" />
											</>
										) : (
											<>
												<path d="m11 17-5-5 5-5" />
												<path d="m18 17-5-5 5-5" />
											</>
										)}
									</svg>
								</button>
							</div>
						</div>
						{showAddContact && (
							<div className={`px-4 pb-3 ${sidebarCollapsed ? 'md:hidden' : ''}`}>
								<form onSubmit={submitNewContact} className="flex items-center gap-1.5">
									<input
										autoFocus
										value={newContactName}
										onChange={(e) => {
											setNewContactName(e.target.value);
											setAddContactError('');
										}}
										onKeyDown={(e) => {
											if (e.key === 'Escape') closeAddContact();
										}}
										placeholder="Start a chat by username…"
										className="flex-1 min-w-0 bg-[#2a2c39] text-[#f8f8f2] placeholder-[#6b6f80] rounded-lg px-3 py-2 text-sm border border-[#bd93f9]/50 focus:outline-none focus:border-[#bd93f9] transition-colors"
									/>
									<button
										type="submit"
										className="w-8 h-8 shrink-0 rounded-lg bg-[#bd93f9] text-[#21222c] hover:bg-[#caa5fb] flex items-center justify-center transition-colors"
										title="Start chat"
										aria-label="Start chat"
									>
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
											<path d="M20 6 9 17l-5-5" />
										</svg>
									</button>
									<button
										type="button"
										onClick={closeAddContact}
										className="w-8 h-8 shrink-0 rounded-lg text-[#6b6f80] hover:text-[#f8f8f2] hover:bg-[#2a2c39] flex items-center justify-center text-lg leading-none transition-colors"
										title="Cancel"
										aria-label="Cancel"
									>
										×
									</button>
								</form>
								{addContactError && (
									<p className="text-[#ff5555] text-xs mt-1.5 px-1">{addContactError}</p>
								)}
							</div>
						)}
						<div className={`px-5 pb-3 ${sidebarCollapsed ? 'md:hidden' : ''}`}>
							<p className="text-sm text-[#8b8fa3] truncate">
								Signed in as <span className="text-[#f8f8f2] font-medium">{currentUser}</span>
							</p>
						</div>
						<div className={`px-4 pb-3 ${sidebarCollapsed ? 'md:hidden' : ''}`}>
							<input
								value={contactSearch}
								onChange={(e) => setContactSearch(e.target.value)}
								placeholder="Search contacts"
								className="w-full bg-[#2a2c39] text-[#f8f8f2] placeholder-[#6b6f80] rounded-lg px-3 py-2 text-sm border border-transparent focus:outline-none focus:border-[#bd93f9] transition-colors"
							/>
						</div>
					</div>
					<div className="flex-1 overflow-y-auto px-2 py-2">
						{visibleContacts.length === 0 ? (
							<p className={`text-center text-sm text-[#6b6f80] mt-6 px-4 ${sidebarCollapsed ? 'md:hidden' : ''}`}>
								{contactSearch ? 'No contacts match your search.' : 'No contacts yet — add one with +.'}
							</p>
						) : (
							visibleContacts.map((c, idx) => {
								const unreadCount = unreadMessages[normalizeUsername(c)] || 0;
								const active = peer === c;
								const online = presence[normalizeUsername(c)] === 'online';
								return (
									<div
										key={`${c}-${idx}`}
										onClick={() => setPeer(c)}
										title={c}
										className={`group px-3 py-2.5 mb-1 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${sidebarCollapsed ? 'md:justify-center md:px-1.5' : ''} ${active ? 'bg-[#bd93f9]/15' : 'hover:bg-[#2a2c39]'
											}`}
									>
										<div className={`flex items-center gap-3 min-w-0 ${sidebarCollapsed ? 'md:gap-0' : ''}`}>
											<div className={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${active
												? 'bg-[#bd93f9] text-[#21222c]'
												: 'bg-[#2f3142] text-[#bd93f9] group-hover:bg-[#363850]'
												}`}>
												{c.slice(0, 2).toUpperCase()}
												{online && (
													<span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#50fa7b] border-2 border-[#21222c]" />
												)}
												{unreadCount > 0 && (
													<span className={`absolute -top-1 -right-1 bg-[#ff5555] text-white text-[10px] rounded-full min-w-4 h-4 px-1 hidden items-center justify-center font-bold ${sidebarCollapsed ? 'md:flex' : ''}`}>
														{unreadCount > 9 ? '9+' : unreadCount}
													</span>
												)}
											</div>
											<span className={`truncate ${sidebarCollapsed ? 'md:hidden' : ''} ${active ? 'text-[#f8f8f2] font-semibold' : 'text-[#c9ccd6]'}`}>{c}</span>
										</div>
										<div className={`flex items-center gap-2 shrink-0 ${sidebarCollapsed ? 'md:hidden' : ''}`}>
											{unreadCount > 0 && (
												<div className="bg-[#ff5555] text-white text-xs rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center font-bold">
													{unreadCount > 9 ? '9+' : unreadCount}
												</div>
											)}
											<button
												onClick={(e) => {
													e.stopPropagation();
													removeContact(c);
												}}
												className="opacity-0 group-hover:opacity-100 text-[#6b6f80] hover:text-[#ff5555] text-lg leading-none transition-opacity"
												title={`Remove ${c}`}
												aria-label={`Remove ${c}`}
											>
												×
											</button>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>

				{/* Main Chat Pane */}
				<div className={`${peer ? 'flex' : 'hidden'} md:flex flex-1 min-w-0 flex-col`}>
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
										{(() => {
											const online = presence[normalizeUsername(peer)] === 'online';
											return (
												<div className={`flex items-center gap-1.5 text-xs leading-tight ${online ? 'text-[#50fa7b]' : 'text-[#8b8fa3]'}`}>
													<span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-[#50fa7b]' : 'bg-[#6b6f80]'}`} />
													{online ? 'online' : 'offline'}
												</div>
											);
										})()}
									</div>
								</div>
							)}
							{!peer && (
								<span className="hidden md:inline text-[#8b8fa3]">Select a contact to start chatting</span>
							)}
						</div>
						<UserProfile user={currentUser} />
					</div>

					{connectionStatus !== 'open' && (
						<div className="text-center text-xs text-[#ffb86c] bg-[#ffb86c]/10 border-b border-[#ffb86c]/20 py-1.5">
							{connectionStatus === 'connecting' ? 'Connecting…' : 'Connection lost — reconnecting…'}
						</div>
					)}

					<div
						ref={listRef}
						onScroll={handleListScroll}
						className="flex-1 overflow-y-auto px-3 md:px-6 py-5 bg-[#1a1b23] bg-[radial-gradient(circle_at_top,_#22232f_0%,_#1a1b23_60%)]">
						{!peer ? (
							<div className="h-full flex flex-col items-center justify-center text-center gap-3">
								<div className="w-16 h-16 rounded-2xl bg-[#21222c] border border-[#33354a] flex items-center justify-center text-2xl">💬</div>
								<p className="text-[#8b8fa3]">No conversation selected.</p>
								<p className="text-[#5c6070] text-sm">Pick a contact on the left to begin.</p>
							</div>
						) : (
							messages.map((m, i) => {
								const isMe = m.from === currentUser;
								const isBot = m.type === 'bot';
								const isChart = isBot && isChartData(m.body);
								const prev = messages[i - 1];
								const dividerLabel =
									m.ts && (!prev?.ts || new Date(prev.ts).toDateString() !== new Date(m.ts).toDateString())
										? dayLabel(m.ts)
										: null;
								const base = 'w-fit max-w-full break-words leading-relaxed shadow-sm';
								const bubbleClass = isChart
									? `${base} bg-[#21222c] ring-1 ring-[#33354a] rounded-2xl p-3`
									: isBot
										? `${base} bg-[#21222c] ring-1 ring-[#33354a] rounded-2xl px-4 py-2.5 text-[#e4e6ee]`
										: isMe
											? `${base} bg-[#bd93f9] text-[#21222c] rounded-2xl rounded-br-md px-4 py-2.5 font-medium`
											: `${base} bg-[#2f3142] text-[#f8f8f2] rounded-2xl rounded-bl-md px-4 py-2.5`;
								return (
									<Fragment key={m.messageid}>
										{dividerLabel && (
											<div className="flex items-center justify-center my-4">
												<span className="text-[11px] uppercase tracking-wide text-[#6b6f80] bg-[#21222c] px-3 py-1 rounded-full border border-[#33354a]">
													{dividerLabel}
												</span>
											</div>
										)}
										<div className={`mb-2.5 flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
											{!isMe && (
												<div className="w-7 h-7 rounded-full bg-[#2f3142] text-[#bd93f9] flex items-center justify-center font-bold text-[10px] shrink-0 mb-0.5">
													{m.from.slice(0, 2).toUpperCase()}
												</div>
											)}
											<div className={`flex flex-col max-w-[80%] md:max-w-md ${isMe ? 'items-end' : 'items-start'}`}>
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
												{m.ts && (
													<span className="text-[10px] text-[#6b6f80] mt-1 px-1">{formatTime(m.ts)}</span>
												)}
											</div>
										</div>
									</Fragment>
								);
							})
						)}
						<div ref={endRef} />
					</div>

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
								isOpen={commandMenuOpen}
								commands={filteredCommands}
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

		</>
	);
}
