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

		if (!username.trim()) {
			setError('Username cannot be empty');
			return;
		}

		if (username.trim() === currentUser) {
			setError('You cannot add yourself as a contact');
			return;
		}

		onAdd(username.trim());
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
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-[#44475a] border-2 border-[#bd93f9] rounded-lg p-6 w-96 max-w-md mx-4">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-bold text-[#f8f8f2]">Add New Contact</h2>
					<button
						onClick={handleClose}
						className="text-[#f8f8f2] hover:text-[#ff5555] transition-colors text-2xl font-bold"
					>
						×
					</button>
				</div>

				<form onSubmit={handleSubmit}>
					<div className="mb-4">
						<label htmlFor="username" className="block text-[#f8f8f2] text-sm font-medium mb-2">
							Enter username:
						</label>
						<input
							type="text"
							id="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Username"
							className="w-full px-4 py-3 bg-[#282a36] border-2 border-[#6272a4] rounded-lg text-[#f8f8f2] placeholder-[#6272a4] focus:outline-none focus:border-[#bd93f9] transition-colors"
							autoFocus
						/>
						{error && (
							<p className="text-[#ff5555] text-sm mt-2">{error}</p>
						)}
					</div>

					<div className="flex gap-3 justify-end">
						<button
							type="button"
							onClick={handleClose}
							className="px-6 py-2 bg-transparent border-2 border-[#6272a4] text-[#6272a4] rounded-lg font-medium hover:bg-[#6272a4] hover:text-[#282a36] transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="px-6 py-2 bg-[#50fa7b] text-[#282a36] rounded-lg font-bold hover:bg-[#ff79c6] transition-colors"
						>
							Add Contact
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
