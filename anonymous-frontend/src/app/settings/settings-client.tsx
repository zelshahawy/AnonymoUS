'use client';
import UserProfile from '@/components/UserProfile';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface SettingsClientProps {
	user: string;
}

export default function SettingsClient({ user }: SettingsClientProps) {
	const [profilePhoto, setProfilePhoto] = useState<string>('');
	const [displayName, setDisplayName] = useState<string>(user);
	const [bio, setBio] = useState<string>('');
	const [isSaving, setIsSaving] = useState(false);
	const [saveMessage, setSaveMessage] = useState('');

	// Load settings from localStorage
	useEffect(() => {
		const saved = localStorage.getItem(`profile_${user}`);
		if (saved) {
			try {
				const data = JSON.parse(saved);
				setProfilePhoto(data.profilePhoto || '');
				setDisplayName(data.displayName || user);
				setBio(data.bio || '');
			} catch {
				// Ignore parse errors
			}
		}
	}, [user]);

	const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				setProfilePhoto(event.target?.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleSave = async () => {
		setIsSaving(true);
		setSaveMessage('');

		try {
			const profileData = {
				profilePhoto,
				displayName,
				bio,
			};
			localStorage.setItem(`profile_${user}`, JSON.stringify(profileData));
			setSaveMessage('Profile saved successfully!');
			setTimeout(() => setSaveMessage(''), 3000);
		} catch (error) {
			setSaveMessage('Error saving profile');
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="min-h-screen bg-[#282a36] flex flex-col">
			{/* Header */}
			<div className="bg-[#44475a] border-b-2 border-[#bd93f9] px-6 py-4 flex items-center justify-between">
				<h1 className="text-2xl font-bold text-[#f8f8f2]">Settings & Profile</h1>
				<div className="flex items-center gap-4">
					<UserProfile user={user} />
					<Link href="/chat">
						<button className="px-4 py-2 bg-[#50fa7b] text-[#282a36] rounded font-bold hover:bg-[#ff79c6] transition-colors">
							Back to Chat
						</button>
					</Link>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 p-6">
				<div className="max-w-2xl mx-auto">
					{/* Profile Photo Section */}
					<div className="bg-[#44475a] rounded-xl border-2 border-[#bd93f9] p-8 mb-6">
						<h2 className="text-xl font-bold text-[#f8f8f2] mb-6">Profile Photo</h2>

						<div className="flex items-center gap-8">
							{/* Photo Preview */}
							<div className="flex-shrink-0">
								<div className="w-32 h-32 rounded-full bg-[#282a36] border-4 border-[#bd93f9] flex items-center justify-center overflow-hidden">
									{profilePhoto ? (
										<img
											src={profilePhoto}
											alt="Profile"
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="text-4xl font-bold text-[#bd93f9]">
											{displayName.slice(0, 2).toUpperCase()}
										</div>
									)}
								</div>
							</div>

							{/* Upload Section */}
							<div className="flex-1">
								<label className="block mb-3">
									<span className="text-[#f8f8f2] font-semibold mb-2 block">Upload Photo</span>
									<input
										type="file"
										accept="image/*"
										onChange={handlePhotoUpload}
										className="block w-full text-sm text-[#6272a4] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#bd93f9] file:text-[#282a36] hover:file:bg-[#ff79c6] cursor-pointer"
									/>
								</label>
								<p className="text-[#6272a4] text-sm">
									Supported formats: JPG, PNG, GIF (Max 5MB)
								</p>
							</div>
						</div>
					</div>

					{/* Profile Info Section */}
					<div className="bg-[#44475a] rounded-xl border-2 border-[#bd93f9] p-8 mb-6">
						<h2 className="text-xl font-bold text-[#f8f8f2] mb-6">Profile Information</h2>

						<div className="space-y-5">
							<div>
								<label className="block text-[#f8f8f2] font-semibold mb-2">Username</label>
								<input
									type="text"
									value={user}
									disabled
									className="w-full px-4 py-3 bg-[#282a36] border-2 border-[#6272a4] text-[#6272a4] rounded-lg cursor-not-allowed"
								/>
								<p className="text-[#6272a4] text-sm mt-1">Username cannot be changed</p>
							</div>

							<div>
								<label className="block text-[#f8f8f2] font-semibold mb-2">Display Name</label>
								<input
									type="text"
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									placeholder="Enter your display name"
									className="w-full px-4 py-3 bg-[#282a36] border-2 border-[#bd93f9] text-[#f8f8f2] placeholder-[#6272a4] rounded-lg focus:outline-none focus:border-[#ff79c6] transition-colors"
								/>
							</div>

							<div>
								<label className="block text-[#f8f8f2] font-semibold mb-2">Bio</label>
								<textarea
									value={bio}
									onChange={(e) => setBio(e.target.value)}
									placeholder="Tell us about yourself..."
									rows={4}
									className="w-full px-4 py-3 bg-[#282a36] border-2 border-[#bd93f9] text-[#f8f8f2] placeholder-[#6272a4] rounded-lg focus:outline-none focus:border-[#ff79c6] transition-colors resize-none"
								/>
								<p className="text-[#6272a4] text-sm mt-1">{bio.length}/500 characters</p>
							</div>
						</div>
					</div>

					{/* Save Section */}
					<div className="flex items-center gap-4">
						<button
							onClick={handleSave}
							disabled={isSaving}
							className="px-8 py-3 bg-[#50fa7b] text-[#282a36] rounded-lg font-bold hover:bg-[#ff79c6] disabled:opacity-50 transition-colors"
						>
							{isSaving ? 'Saving...' : 'Save Changes'}
						</button>

						{saveMessage && (
							<div className={`px-4 py-2 rounded-lg font-medium ${saveMessage.includes('successfully') ? 'bg-[#50fa7b] text-[#282a36]' : 'bg-[#ff5555] text-[#f8f8f2]'}`}>
								{saveMessage}
							</div>
						)}
					</div>

					{/* Info Box */}
					<div className="mt-8 bg-[#44475a] border-2 border-[#6272a4] rounded-lg p-4">
						<p className="text-[#6272a4] text-sm">
							💡 Your profile information is stored locally in your browser. It will be cleared if you clear your browser data.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
