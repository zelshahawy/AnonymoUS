'use client';

import { useState } from 'react';

interface AddContactModalProps {
	isOpen: boolean;
	onClose: () => void;
	onAdd: (username: string) => void;
	currentUser: string;
}

export default function AddContactModal({ isOpen, onClose, onAdd, currentUser }: AddContactModalProps) {
	const [username, setUsername] = useState('');
	const [error, setError] = useState('');

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedUsername = username.trim();
		const normalizedUsername = trimmedUsername.toLowerCase();
		const normalizedCurrentUser = currentUser.trim().toLowerCase();

		if (!trimmedUsername) {
			setError('Username cannot be empty');
			return;
		}

		if (normalizedUsername === normalizedCurrentUser) {
			setError('You cannot add yourself as a contact');
			return;
		}

		onAdd(trimmedUsername);
		setUsername('');
		setError('');
		onClose();
	};

	const handleClose = () => {
		setUsername('');
		setError('');
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
			onClick={handleClose}
		>
			<div
				className="bg-[#21222c] border border-[#33354a] rounded-2xl w-full max-w-sm shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="flex items-start justify-between p-5 pb-4">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-[#bd93f9]/15 text-[#bd93f9] flex items-center justify-center text-xl shrink-0">
							+
						</div>
						<div>
							<h2 className="text-lg font-bold text-[#f8f8f2] leading-tight">New chat</h2>
							<p className="text-xs text-[#8b8fa3]">Start a conversation by username</p>
						</div>
					</div>
					<button
						onClick={handleClose}
						className="text-[#6b6f80] hover:text-[#f8f8f2] transition-colors text-xl leading-none -mt-1"
						aria-label="Close"
					>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit} className="px-5 pb-5">
					<input
						type="text"
						id="username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="Enter a username…"
						className="w-full px-4 py-3 bg-[#2a2c39] rounded-xl text-[#f8f8f2] placeholder-[#6b6f80] border border-transparent focus:outline-none focus:border-[#bd93f9] transition-colors"
						autoFocus
					/>
					{error && (
						<p className="text-[#ff5555] text-sm mt-2">{error}</p>
					)}

					<div className="flex gap-2 mt-5">
						<button
							type="button"
							onClick={handleClose}
							className="flex-1 px-4 py-2.5 rounded-xl text-[#c9ccd6] bg-[#2a2c39] hover:bg-[#33354a] font-medium transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="flex-1 px-4 py-2.5 rounded-xl bg-[#bd93f9] text-[#21222c] font-bold hover:bg-[#caa5fb] transition-colors"
						>
							Add
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
