'use client';
import { useEffect, useState } from 'react';

export default function ToraCoachChatBox({ userId }) {
	const [messages, setMessages] = useState([]);
	const [input, setInput] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const loadMessages = async () => {
			const res = await fetch(`/api/tora-coach/chat?userId=${userId}`);
			const data = await res.json();
			setMessages(data);
		};
		loadMessages();
	}, [userId]);

	const sendMessage = async () => {
		if (!input.trim()) return;
		setLoading(true);
		setMessages((prev) => [...prev, { sender: 'user', content: input }]);
		setInput('');

		const res = await fetch('/api/tora-coach/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId, message: input }),
		});
		const data = await res.json();
		setMessages((prev) => [...prev, { sender: 'coach', content: data.reply }]);
		setLoading(false);
	};

	return (
		<div className="p-4 bg-[#161b22] rounded-xl text-white space-y-4">
			<h2 className="text-xl font-semibold">💬 Tora Coach Chat</h2>
			<div className="h-64 overflow-y-auto bg-[#0d1117] p-3 rounded border border-gray-700">
				{messages.map((msg, idx) => (
					<div
						key={idx}
						className={`mb-2 ${
							msg.sender === 'user' ? 'text-right' : 'text-left'
						}`}
					>
						<span className="block px-2 py-1 bg-gray-800 rounded inline-block">
							{msg.content}
						</span>
					</div>
				))}
			</div>
			<div className="flex space-x-2">
				<input
					className="flex-1 px-3 py-2 rounded bg-[#0d1117] border border-gray-700"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Type your question to Coach..."
				/>
				<button
					onClick={sendMessage}
					className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
					disabled={loading}
				>
					{loading ? 'Sending...' : 'Send'}
				</button>
			</div>
		</div>
	);
}
