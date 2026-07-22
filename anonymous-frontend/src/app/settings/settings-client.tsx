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
		<div className="min-h-screen bg-[#1a1b23] text-[#f8f8f2] flex flex-col">
			{/* Header */}
			<div className="bg-[#21222c]/95 backdrop-blur border-b border-[#33354a] px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
				<div className="flex items-center gap-3 min-w-0">
					<Link href="/chat">
						<button className="px-3.5 py-1.5 text-sm text-[#c9ccd6] bg-[#2a2c39] rounded-lg hover:bg-[#33354a] hover:text-[#f8f8f2] transition-colors whitespace-nowrap">
							← Chat
						</button>
					</Link>
					<h1 className="text-lg md:text-xl font-bold tracking-tight truncate">Settings & Profile</h1>
				</div>
				<UserProfile user={user} />
			</div>

			{/* Main Content */}
			<div className="flex-1 p-4 md:p-6">
				<div className="max-w-2xl mx-auto">
					{/* Profile Photo Section */}
					<div className="bg-[#21222c] rounded-2xl border border-[#33354a] p-6 md:p-8 mb-5">
						<h2 className="text-lg font-bold mb-6">Profile photo</h2>

						<div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
							{/* Photo Preview */}
							<div className="shrink-0">
								<div className="w-28 h-28 rounded-full bg-[#2f3142] border border-[#33354a] flex items-center justify-center overflow-hidden">
									{profilePhoto ? (
										<img
											src={profilePhoto}
											alt="Profile"
											className="w-full h-full object-cover"
										/>
									) : (
										<div className="text-3xl font-bold text-[#bd93f9]">
											{displayName.slice(0, 2).toUpperCase()}
										</div>
									)}
								</div>
							</div>

							{/* Upload Section */}
							<div className="flex-1 w-full">
								<label className="block mb-2">
									<span className="text-[#c9ccd6] font-medium text-sm mb-2 block">Upload photo</span>
									<input
										type="file"
										accept="image/*"
										onChange={handlePhotoUpload}
										className="block w-full text-sm text-[#6b6f80] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#bd93f9]/15 file:text-[#bd93f9] hover:file:bg-[#bd93f9]/25 file:transition-colors cursor-pointer"
									/>
								</label>
								<p className="text-[#6b6f80] text-xs">
									Supported formats: JPG, PNG, GIF (Max 5MB)
								</p>
							</div>
						</div>
					</div>

					{/* Profile Info Section */}
					<div className="bg-[#21222c] rounded-2xl border border-[#33354a] p-6 md:p-8 mb-5">
						<h2 className="text-lg font-bold mb-6">Profile information</h2>

						<div className="space-y-5">
							<div>
								<label className="block text-[#c9ccd6] font-medium mb-1.5 text-sm">Username</label>
								<input
									type="text"
									value={user}
									disabled
									className="w-full px-4 py-3 bg-[#1a1b23] border border-[#33354a] text-[#6b6f80] rounded-xl cursor-not-allowed"
								/>
								<p className="text-[#6b6f80] text-xs mt-1.5">Username cannot be changed</p>
							</div>

							<div>
								<label className="block text-[#c9ccd6] font-medium mb-1.5 text-sm">Display name</label>
								<input
									type="text"
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									placeholder="Enter your display name"
									className="w-full px-4 py-3 bg-[#2a2c39] text-[#f8f8f2] placeholder-[#6b6f80] rounded-xl border border-transparent focus:outline-none focus:border-[#bd93f9] transition-colors"
								/>
							</div>

							<div>
								<label className="block text-[#c9ccd6] font-medium mb-1.5 text-sm">Bio</label>
								<textarea
									value={bio}
									onChange={(e) => setBio(e.target.value)}
									placeholder="Tell us about yourself..."
									rows={4}
									className="w-full px-4 py-3 bg-[#2a2c39] text-[#f8f8f2] placeholder-[#6b6f80] rounded-xl border border-transparent focus:outline-none focus:border-[#bd93f9] transition-colors resize-none"
								/>
								<p className="text-[#6b6f80] text-xs mt-1.5">{bio.length}/500 characters</p>
							</div>
						</div>
					</div>

					{/* Save Section */}
					<div className="flex flex-wrap items-center gap-3">
						<button
							onClick={handleSave}
							disabled={isSaving}
							className="px-7 py-2.5 bg-[#bd93f9] text-[#21222c] rounded-full font-bold hover:bg-[#caa5fb] disabled:opacity-50 transition-colors"
						>
							{isSaving ? 'Saving…' : 'Save changes'}
						</button>

						{saveMessage && (
							<div className={`px-4 py-2 rounded-full text-sm font-medium border ${saveMessage.includes('successfully')
								? 'bg-[#50fa7b]/10 border-[#50fa7b]/30 text-[#50fa7b]'
								: 'bg-[#ff5555]/10 border-[#ff5555]/30 text-[#ff9a9a]'}`}>
								{saveMessage}
							</div>
						)}
					</div>

					{/* Info Box */}
					<div className="mt-6 bg-[#21222c]/60 border border-[#33354a] rounded-xl p-4">
						<p className="text-[#8b8fa3] text-sm leading-relaxed">
							💡 Your profile information is stored locally in your browser. It will be cleared if you clear your browser data.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
