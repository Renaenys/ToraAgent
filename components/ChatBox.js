'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Modal from './Modal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useContactContext } from '@/context/ContactContext';
import { useCalendarContext } from '@/context/CalendarContext';
import { useShoppingContext } from '@/context/ShoppingContext';
import { FiSend } from 'react-icons/fi';

function extractLastJsonObject(text) {
	const matches = text.match(/({[\s\S]*?})\s*$/);
	if (!matches) return null;
	try {
		return JSON.parse(matches[1]);
	} catch {
		return null;
	}
}

export default function ChatBox({ activeSessionId }) {
	const { data: session } = useSession();
	const inputRef = useRef(null);
	const { triggerRefresh } = useContactContext();
	const { triggerRefresh: refreshCalendar } = useCalendarContext();
	const { triggerRefresh: refreshShopping } = useShoppingContext();
	const [sessionId, setSessionId] = useState(null);
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState('');
	const [modalData, setModalData] = useState(null);
	const bottomRef = useRef();
	const [copiedIndex, setCopiedIndex] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (activeSessionId) {
			fetch('/api/chat/session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId: activeSessionId }),
			})
				.then((res) => res.json())
				.then((data) => {
					setSessionId(data.sessionId);
					setMessages(data.messages || []);
				});
		} else {
			const newSessionId =
				crypto.randomUUID?.() || Math.random().toString(36).substring(2);
			setSessionId(newSessionId);
			setMessages([]);
		}
	}, [activeSessionId]);

	useEffect(() => {
		function handleVoiceMsg(e) {
			const updates = e.detail;
			if (!Array.isArray(updates)) return;

			setMessages((prev) => [...prev, ...updates]);

			const userPrompt = updates.find((u) => u.role === 'user')?.content;
			if (userPrompt) {
				fetch('/api/chat/respond', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sessionId, prompt: userPrompt }),
				})
					.then((res) => res.json())
					.then((data) => {
						const reply = data.reply || '';
						// ✅ only add voice response to chat, avoid re-adding elsewhere
						setMessages((prev) => [
							...prev.filter((m) => m.content !== '...'),
							{ role: 'assistant', content: reply },
						]);
						setIsLoading(false);
						window.dispatchEvent(
							new CustomEvent('tts-speak', { detail: reply })
						);
						handleParsedActions(reply); // 👈 manually handle actions
					});
			}
		}
		window.addEventListener('voice-chat-msg', handleVoiceMsg);
		return () => window.removeEventListener('voice-chat-msg', handleVoiceMsg);
	}, [sessionId]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const resolveContactEmail = async (name) => {
		const res = await fetch('/api/contacts/lookup', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name }),
		});
		const data = await res.json();

		if (data?.contacts?.length === 1) {
			return data.contacts[0].email;
		}

		if (data?.contacts?.length > 1) {
			// Optional: prefer exact match if available
			const exactMatch = data.contacts.find(
				(c) => c.name.toLowerCase() === name.toLowerCase()
			);
			if (exactMatch) return exactMatch.email;

			return {
				error: `Found ${data.contacts.length} people named "${name}". Please be more specific.`,
			};
		}

		return { error: 'No contact found.' };
	};

	const handleParsedActions = async (reply) => {
		const parsed = extractLastJsonObject(reply);
		if (!parsed) return;

		if (parsed.to && !parsed.to.includes('@')) {
			const contactResult = await resolveContactEmail(parsed.to);
			if (typeof contactResult === 'string') {
				parsed.to = contactResult;
				reply = reply.replace(/({[\s\S]*?})\s*$/, '');
				reply = `${reply.trim()}\n\n${JSON.stringify(parsed)}`;
				setMessages((m) => [
					...m.slice(0, -1),
					{ role: 'assistant', content: reply },
				]);
			} else {
				setMessages((m) => [
					...m,
					{ role: 'assistant', content: contactResult.error },
				]);
				return;
			}
		}

		if (parsed.title && parsed.start && parsed.end) {
			setModalData({ type: 'event', data: parsed });
		} else if (parsed.to && parsed.subject && parsed.body) {
			setModalData({ type: 'email', data: parsed });
		} else if (parsed.name && (parsed.email || parsed.phone)) {
			setModalData({ type: 'contact', data: parsed });
		} else if (parsed?.type === 'shopping') {
			if (parsed.action === 'get-shopping') {
				refreshShopping();
				return;
			}
			setModalData({ type: 'shopping', data: parsed });
		}
	};

	const handleAIResponse = async (reply, isVoice = false) => {
		const parsed = extractLastJsonObject(reply);

		setMessages((m) => {
			const cleaned = m.filter((msg) => msg.content !== '...');
			return [...cleaned, { role: 'assistant', content: reply }];
		});

		setIsLoading(false);

		if (isVoice) {
			window.dispatchEvent(new CustomEvent('tts-speak', { detail: reply }));
		}

		handleParsedActions(reply);
	};

	const handleSend = async () => {
		if (!input.trim() || !sessionId || isLoading) return;
		const prompt = input;
		setInput('');
		setIsLoading(true);

		setMessages((m) => [
			...m,
			{ role: 'user', content: prompt },
			{ role: 'assistant', content: '...' },
		]);

		const res = await fetch('/api/chat/respond', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId, prompt }),
		});

		const data = await res.json();
		await handleAIResponse(data.reply || '');
	};

	const handleModalSubmit = async () => {
		if (!modalData || !session || isSubmitting) return;

		setIsSubmitting(true); // prevent double click

		const urlMap = {
			event: '/api/calendar/create',
			email: '/api/email/send',
			contact: '/api/contacts/sync',
			shopping: '/api/shopping', // ✅ your endpoint
		};

		const url = urlMap[modalData.type];
		const payload = {
			email: session?.user?.email, // ✅ fix here
			sessionId,
			...modalData.data,
		};

		try {
			await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (modalData.type === 'contact') triggerRefresh();
			if (modalData.type === 'event') refreshCalendar();
			if (modalData.type === 'shopping') {
				const existingItemsRes = await fetch(
					'/api/shopping?email=' + session.user.email
				);
				const existingItemsData = await existingItemsRes.json();
				const existingItems = existingItemsData.items || [];

				await Promise.all(
					modalData.data.items.map(async (i) => {
						const match = existingItems.find(
							(e) =>
								e.item?.toLowerCase().trim() === i.name.toLowerCase().trim()
						);

						if (match) {
							// ✅ Update the item
							await fetch(`/api/shopping/${match._id}`, {
								method: 'PUT',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ done: i.done }),
							});
						} else {
							// ✅ Add new item
							await fetch('/api/shopping', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									email: session.user.email,
									items: [{ name: i.name, done: i.done || false }],
								}),
							});
						}
					})
				);

				refreshShopping();
				setMessages((m) => [
					...m,
					{ role: 'assistant', content: `shopping confirmed ✅` },
				]);
				setModalData(null);
				return;
			}

			setMessages((m) => [
				...m,
				{ role: 'assistant', content: `${modalData.type} confirmed ✅` },
			]);

			setModalData(null);
		} catch (err) {
			setMessages((m) => [
				...m,
				{ role: 'assistant', content: '❌ Something went wrong.' },
			]);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex flex-col h-full min-h-0 bg-gray-900 text-white overflow-hidden rounded-xl">
			{/* Message List */}
			<div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 bg-indigo-950">
				{messages.map((m, i) => (
					<div
						key={i}
						className={`flex ${
							m.role === 'user' ? 'justify-end' : 'justify-start'
						}`}
					>
						<div
							className={`max-w-[75%] p-3 rounded-lg whitespace-pre-wrap break-words ${
								m.role === 'user'
									? 'bg-blue-600 text-white'
									: m.content === '...'
									? 'bg-gray-600 text-white italic animate-pulse text-xl font-bold px-6 py-3'
									: 'bg-gray-700 text-gray-200'
							}`}
						>
							<ReactMarkdown
								remarkPlugins={[remarkGfm]}
								components={{
									code({ inline, children, ...props }) {
										if (inline) {
											return (
												<code {...props} className="bg-gray-700 px-1 rounded">
													{children}
												</code>
											);
										}
										return (
											<div className="relative">
												<div className="bg-gray-800 p-2 rounded-lg overflow-x-auto">
													<code {...props}>{children}</code>
												</div>
												{typeof window !== 'undefined' &&
													navigator.clipboard && (
														<CopyToClipboard
															text={String(children)}
															onCopy={() => setCopiedIndex(i)}
														>
															<button className="absolute top-2 right-2 text-sm px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded">
																{copiedIndex === i ? 'Copied' : 'Copy'}
															</button>
														</CopyToClipboard>
													)}
											</div>
										);
									},
								}}
							>
								{m.content}
							</ReactMarkdown>
						</div>
					</div>
				))}
				<div ref={bottomRef} />
			</div>

			{/* Input Bar */}
			<div className="p-3 bg-gray-800 flex items-end space-x-2">
				<textarea
					ref={inputRef}
					rows={1}
					value={input}
					onChange={(e) => {
						setInput(e.target.value);
						if (inputRef.current) {
							inputRef.current.style.height = 'auto';
							inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
						}
					}}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							handleSend();
						}
					}}
					className="flex-1 p-2 rounded-l-lg bg-gray-700 text-white resize-none focus:outline-none max-h-48 overflow-y-auto"
					placeholder="Type a message..."
					disabled={isLoading}
				/>
				<button
					onClick={handleSend}
					disabled={isLoading}
					className={`p-3 rounded-full ${
						isLoading
							? 'bg-gray-600 cursor-not-allowed'
							: 'bg-green-500 hover:bg-green-600'
					}`}
					title="Send"
				>
					<FiSend size={18} />
				</button>
			</div>

			{/* Modal (unchanged) */}
			{modalData && (
				<Modal
					onClose={() => setModalData(null)}
					onSubmit={handleModalSubmit}
					isLoading={isSubmitting}
				>
					<div className="space-y-4">
						<h3 className="text-xl font-semibold capitalize">
							{modalData.type} Confirmation
						</h3>

						<pre className="bg-gray-800 text-sm p-3 rounded text-gray-200 overflow-x-auto whitespace-pre-wrap">
							{JSON.stringify(modalData.data, null, 2)}
						</pre>

						<div className="flex justify-end gap-2 pt-2">
							<button
								onClick={() => setModalData(null)}
								className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded"
							>
								Cancel
							</button>
							<button
								onClick={handleModalSubmit}
								disabled={isSubmitting}
								className={`py-2 px-4 rounded ${
									isSubmitting
										? 'bg-green-800'
										: 'bg-green-600 hover:bg-green-500'
								}`}
							>
								{isSubmitting ? 'Saving...' : 'Confirm'}
							</button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	);
}
