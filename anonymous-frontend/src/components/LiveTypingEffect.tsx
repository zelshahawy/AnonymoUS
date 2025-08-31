'use client';

import { useEffect, useState } from 'react';

interface LiveTypingEffectProps {
	phrases: string[];
	typingSpeed?: number;
	deletingSpeed?: number;
	pauseTime?: number;
}

export default function LiveTypingEffect({
	phrases,
	typingSpeed = 100,
	deletingSpeed = 50,
	pauseTime = 2000
}: LiveTypingEffectProps) {
	const [currentText, setCurrentText] = useState('');
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		const timeout = setTimeout(() => {
			const current = phrases[currentIndex];

			if (!isDeleting) {
				if (currentText.length < current.length) {
					setCurrentText(current.substring(0, currentText.length + 1));
				} else {
					setTimeout(() => setIsDeleting(true), pauseTime);
				}
			} else {
				if (currentText.length > 0) {
					setCurrentText(current.substring(0, currentText.length - 1));
				} else {
					setIsDeleting(false);
					setCurrentIndex((prev) => (prev + 1) % phrases.length);
				}
			}
		}, isDeleting ? deletingSpeed : typingSpeed);

		return () => clearTimeout(timeout);
	}, [currentText, currentIndex, isDeleting, phrases, typingSpeed, deletingSpeed, pauseTime]);

	return (
		<span className="text-[#50fa7b]">
			{currentText}
			<span className="animate-pulse">|</span>
		</span>
	);
}
