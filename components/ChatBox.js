'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Modal from './Modal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useContactContext } from '@/context/ContactContext';
import { useCalendarContext } from '@/context/CalendarContext';

import { FiSend } from 'react-icons/fi';

// ✅ FIX: Robustly extract last valid JSON block from message
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
	const [sessionId, setSessionId] = useState(null);
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState('');
	const [modalData, setModalData] = useState(null);
	const bottomRef = useRef();
	const [copiedIndex, setCopiedIndex] = useState(null);
	const [isLoading, setIsLoading] = useState(false);

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
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

	const handleAIResponse = (reply) => {
		const parsed = extractLastJsonObject(reply);
		setMessages((m) => {
			const cleaned = m.filter((msg) => msg.content !== '...');
			return [...cleaned, { role: 'assistant', content: reply }];
		});
		setIsLoading(false);

		if (parsed) {
			if (parsed.title && parsed.start && parsed.end) {
				setModalData({ type: 'event', data: parsed });
			} else if (parsed.to && parsed.subject && parsed.body) {
				setModalData({ type: 'email', data: parsed });
			} else if (parsed.name && parsed.email !== undefined) {
				setModalData({ type: 'contact', data: parsed });
			}
		}
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
		handleAIResponse(data.reply || '');
	};

	const handleModalSubmit = async () => {
		if (!modalData || !session) return;

		const urlMap = {
			event: '/api/calendar/create',
			email: '/api/email/send',
			contact: '/api/contacts/sync',
		};

		const url = urlMap[modalData.type];
		const payload = {
			userEmail: session?.user?.email,
			sessionId, // ✅ add this line=
			...modalData.data,
		};

		await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
		});

		if (modalData.type === 'contact') triggerRefresh();
		if (modalData.type === 'event') {
			refreshCalendar();
		}

		setMessages((m) => [
			...m,
			{ role: 'assistant', content: `${modalData.type} confirmed ✅` },
		]);
		setModalData(null);
		setIsLoading(false);
	};

	return (
		<div className="flex flex-col flex-1 min-h-0 bg-gray-900 text-white overflow-hidden rounded-xl">
			<div className="flex-1 overflow-y-auto p-4 space-y-2 bg-indigo-950">
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
											<>
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
											</>
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

			{modalData && (
				<Modal onClose={() => setModalData(null)}>
					<div>
						{modalData.type === 'event' && (
							<>
								<h2 className="text-lg font-semibold mb-2">Confirm Event</h2>
								<p>Title: {modalData.data.title}</p>
								<p>Start: {modalData.data.start}</p>
								<p>End: {modalData.data.end}</p>
							</>
						)}
						{modalData.type === 'email' && (
							<>
								<h2 className="text-lg font-semibold mb-2">Confirm Email</h2>
								<p>To: {modalData.data.to}</p>
								<p>Subject: {modalData.data.subject}</p>
							</>
						)}
						{modalData.type === 'contact' && (
							<>
								<h2 className="text-lg font-semibold mb-2">Confirm Contact</h2>
								<p>Name: {modalData.data.name}</p>
								<p>Email: {modalData.data.email}</p>
								{modalData.data.phone && <p>Phone: {modalData.data.phone}</p>}
							</>
						)}
					</div>
					<button
						className="mt-4 p-2 bg-green-500 w-full rounded"
						onClick={handleModalSubmit}
					>
						Confirm
					</button>
				</Modal>
			)}
		</div>
	);
}
