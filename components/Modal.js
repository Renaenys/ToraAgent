'use client';

import { useEffect } from 'react';

export default function Modal({ children, onClose }) {
	useEffect(() => {
		const handler = (e) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, [onClose]);

	return (
		<div
			onClick={onClose}
			className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
		>
			<div
				onClick={(e) => e.stopPropagation()}
				className="bg-[#1f2937] text-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-scaleIn border border-gray-700"
			>
				{children}
			</div>

			<style jsx global>{`
				@keyframes scaleIn {
					0% {
						opacity: 0;
						transform: scale(0.9);
					}
					100% {
						opacity: 1;
						transform: scale(1);
					}
				}
				.animate-scaleIn {
					animation: scaleIn 0.2s ease-out;
				}
			`}</style>
		</div>
	);
}
