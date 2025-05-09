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
		<div className="bg-[#161b22]  text-white h-full flex flex-col">
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
							onClick={() => {
								setSelectedEmail(msg);
								setAiReplyPrompt(`Reply to: "${msg.snippet}"`);
								setAiResponse('');
								setShowReplyModal(false);
							}}
						>
							<div className="flex justify-between items-center">
								<div className="flex-1 overflow-hidden">
									<p className="font-medium truncate">
										{msg.subject || 'No subject'}
									</p>
									<p className="text-sm text-gray-400 truncate">
										From: {msg.from?.email || 'Unknown'}
									</p>
								</div>
								<button
									className="ml-3 text-red-500 hover:text-red-400"
									title="Delete Email"
									onClick={(e) => {
										e.stopPropagation();

										const toastId = toast(
											({ closeToast }) => (
												<div className="text-white">
													<p className="mb-2">⚠️ Confirm delete this email?</p>
													<div className="flex gap-2">
														<button
															onClick={() => {
																handleDeleteEmail(msg.id, true);
																toast.dismiss(toastId);
															}}
															className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-medium"
														>
															Yes, delete
														</button>
														<button
															onClick={() => toast.dismiss(toastId)}
															className="bg-gray-500 hover:bg-gray-600 px-3 py-1 rounded text-sm font-medium"
														>
															Cancel
														</button>
													</div>
												</div>
											),
											{
												autoClose: false,
												closeOnClick: false,
												draggable: false,
												position: 'bottom-right',
												style: { background: '#1f2937' },
											}
										);
									}}
								>
									<FiTrash2 />
								</button>
							</div>
						</div>
					))
				)}
			</div>

			{/* Email Detail Modal */}
			{selectedEmail && (
				<Modal onClose={() => setSelectedEmail(null)}>
					<div className="text-white space-y-3 max-w-md mx-auto p-4">
						<div className="flex justify-between items-center">
							<h3 className="text-lg font-bold">
								{selectedEmail.subject || 'No Subject'}
							</h3>
							<button onClick={() => setSelectedEmail(null)}>
								<FiX />
							</button>
						</div>
						<p className="text-sm text-gray-300">
							From: {selectedEmail.from?.email}
						</p>
						<hr className="border-gray-700" />
						<p className="whitespace-pre-wrap text-sm">
							{selectedEmail.snippet || 'No content'}
						</p>
						{/* ✅ Mark as Read Button */}
						<button
							onClick={async () => {
								const res = await fetch('/api/email/mark-read', {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({
										email: session.user.email,
										id: selectedEmail.id,
									}),
								});

								if (res.ok) {
									toast.success('📨 Marked as read');
									setMessages((msgs) =>
										msgs.filter((msg) => msg.id !== selectedEmail.id)
									);
									setSelectedEmail(null);
								} else {
									toast.error('❌ Failed to mark as read');
								}
							}}
							className="mt-4 w-full bg-yellow-600 hover:bg-yellow-700 py-2 rounded-xl"
						>
							Mark as Read
						</button>

						{/* ✅ Reply Button */}
						<button
							onClick={() => setShowReplyModal(true)}
							className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-xl"
						>
							Reply with AI
						</button>
					</div>
				</Modal>
			)}

			{/* AI Reply Modal */}
			{showReplyModal && (
				<Modal onClose={() => setShowReplyModal(false)}>
					<div className="text-white space-y-4 max-w-lg mx-auto p-4">
						<h3 className="text-lg font-bold">AI Email Reply</h3>

						{/* Modern input */}
						<textarea
							className="w-full bg-[#111827] text-white rounded-2xl text-base p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner resize-none min-h-[100px]"
							placeholder="Write a prompt for the AI to help craft your reply..."
							value={aiReplyPrompt}
							onChange={(e) => setAiReplyPrompt(e.target.value)}
						/>

						{/* Generate button */}
						<button
							onClick={handleGenerateReply}
							disabled={loadingReply || !aiReplyPrompt}
							className={`w-full flex justify-center items-center gap-2 py-2 rounded-xl ${
								loadingReply
									? 'bg-gray-600 cursor-not-allowed'
									: 'bg-blue-600 hover:bg-blue-700'
							}`}
						>
							<FiSend />
							{loadingReply ? 'Generating...' : 'Generate Reply'}
						</button>

						{/* Result */}
						{aiResponse && (
							<>
								<div className="mt-4 p-4 bg-[#0f172a] rounded-lg text-sm whitespace-pre-wrap border border-blue-500">
									{aiResponse}
								</div>
								<button
									className="w-full mt-3 bg-green-600 hover:bg-green-700 py-2 rounded-xl font-semibold"
									onClick={handleSendEmail}
								>
									Send Email
								</button>
							</>
						)}
					</div>
				</Modal>
			)}
		</div>
	);
}
