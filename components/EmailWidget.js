'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FiMail, FiSend, FiX, FiTrash2 } from 'react-icons/fi';
import Modal from '@/components/Modal';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function EmailWidget() {
	const { data: session } = useSession();
	const [messages, setMessages] = useState([]);
	const [selectedEmail, setSelectedEmail] = useState(null);
	const [showReplyModal, setShowReplyModal] = useState(false);
	const [aiReplyPrompt, setAiReplyPrompt] = useState('');
	const [aiResponse, setAiResponse] = useState('');
	const [loadingReply, setLoadingReply] = useState(false);

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

	const handleGenerateReply = async () => {
		if (!aiReplyPrompt || !selectedEmail) return;
		setLoadingReply(true);
		setAiResponse('');

		const userName = session?.user?.name || 'Your Name';
		const recipientEmail = selectedEmail?.from?.email || '';
		const recipientName = recipientEmail?.split('@')[0] || 'there';

		try {
			const res = await fetch('/api/email/ai-reply', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userName,
					recipientName,
					recipientEmail,
					subject: selectedEmail.subject || 'No Subject',
					originalMessage: selectedEmail.snippet,
					userPrompt: aiReplyPrompt,
				}),
			});

			const data = await res.json();

			// Optional: validate JSON safely
			let parsed = {};
			try {
				parsed = JSON.parse(data.reply);
			} catch {
				setAiResponse('❌ Failed to parse AI reply');
				setLoadingReply(false);
				return;
			}

			setAiResponse(parsed.body || 'No reply generated.');
		} catch (err) {
			console.error('AI reply error:', err);
			setAiResponse('❌ Failed to generate reply');
		} finally {
			setLoadingReply(false);
		}
	};

	const handleDeleteEmail = async (id, skipToast = false) => {
		if (!skipToast) return;

		const res = await fetch('/api/email/delete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: session.user.email, id }),
		});

		if (res.ok) {
			toast.success('🗑️ Email deleted');
			setMessages((msgs) => msgs.filter((msg) => msg.id !== id));
		} else {
			toast.error('❌ Failed to delete email');
		}
	};

	const handleSendEmail = async () => {
		if (!session?.user?.email || !selectedEmail?.from?.email || !aiResponse) {
			toast.error('❌ Missing required fields');
			return;
		}

		const subjectLine = selectedEmail.subject?.toLowerCase().startsWith('re:')
			? selectedEmail.subject
			: `Re: ${selectedEmail.subject || 'No Subject'}`;

		const res = await fetch('/api/email/send', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: session.user.email,
				to: selectedEmail.from.email,
				subject: subjectLine,
				body: aiResponse,
			}),
		});

		if (res.ok) {
			toast.success('✅ Email sent');
			setShowReplyModal(false);
			setSelectedEmail(null);
		} else {
			const err = await res.json();
			toast.error('❌ Send failed: ' + (err?.error || 'Unknown error'));
		}
	};

	return (
		<div className="bg-[#111827]/80 backdrop-blur-md rounded-2xl text-white h-full flex flex-col shadow-lg">
			<h2 className="text-xl font-semibold mb-4 px-4 flex items-center gap-2">
				<FiMail /> My Inbox
			</h2>
			<div className="flex-1 overflow-y-auto space-y-2 px-4 pr-1">
				{messages.length === 0 ? (
					<p className="text-gray-400">No messages found.</p>
				) : (
					messages.slice(0, 5).map((msg) => (
						<div
							key={msg.id}
							className="bg-[#1f2937] p-3 rounded-xl cursor-pointer hover:bg-[#2a2f3a] transition"
							onClick={() => {
								setSelectedEmail(msg);
								setAiReplyPrompt(`Reply to: "${msg.snippet}"`);
								setAiResponse('');
								setShowReplyModal(false);
							}}
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
		</div>
	);
}
