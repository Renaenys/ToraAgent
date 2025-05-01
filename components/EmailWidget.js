'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FiMail } from 'react-icons/fi';
import Modal from '@/components/Modal';

export default function EmailWidget() {
	const { data: session } = useSession();
	const [messages, setMessages] = useState([]);
	const [selectedEmail, setSelectedEmail] = useState(null);

	useEffect(() => {
		if (!session?.user?.email) return;

		fetch('/api/email/read', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: session.user.email }),
		})
			.then((res) => res.json())
			.then((data) => setMessages(data.messages || []));
	}, [session]);

	return (
		<div className="bg-[#161b22] rounded-xl shadow-lg text-white h-full flex flex-col">
			<h2 className="text-xl font-semibold mb-4 px-4 flex items-center gap-2">
				<FiMail /> My Inbox
			</h2>

			<div className="flex-1 overflow-y-auto space-y-2 px-4 pr-1 custom-scroll">
				{messages.length === 0 ? (
					<p className="text-gray-400">No messages found.</p>
				) : (
					messages.slice(0, 5).map((msg) => (
						<div
							key={msg.id}
							className="bg-[#1f2937] p-3 rounded cursor-pointer hover:bg-[#2a2f3a] transition"
							onClick={() => setSelectedEmail(msg)}
						>
							<p className="font-medium truncate">
								{msg.subject || 'No subject'}
							</p>
							<p className="text-sm text-gray-400 truncate">
								From: {msg.from?.email || 'Unknown'}
							</p>
						</div>
					))
				)}
			</div>

			{selectedEmail && (
				<Modal onClose={() => setSelectedEmail(null)}>
					<div className="text-white space-y-2">
						<h3 className="text-lg font-bold">
							{selectedEmail.subject || 'No Subject'}
						</h3>
						<p className="text-sm text-gray-300">
							From: {selectedEmail.from?.email}
						</p>
						<hr className="border-gray-600" />
						<p className="whitespace-pre-wrap">
							{selectedEmail.snippet || 'No content'}
						</p>
					</div>
				</Modal>
			)}
		</div>
	);
}
