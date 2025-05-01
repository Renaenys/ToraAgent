'use client';

import { useEffect, useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ChatHistorySidebar({ onSelect }) {
	const [sessions, setSessions] = useState([]);

	const fetchSessions = async () => {
		const res = await fetch('/api/chat/history');
		const data = await res.json();
		setSessions(data.logs || []);
	};

	useEffect(() => {
		fetchSessions();
	}, []);

	const confirmDelete = (sessionId) => {
		const id = toast.info(
			<div>
				<p className="font-semibold text-white">Delete this session?</p>
				<div className="mt-2 flex justify-end space-x-2">
					<button
						onClick={() => {
							toast.dismiss(id);
							handleDelete(sessionId);
						}}
						className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-white text-sm"
					>
						Yes
					</button>
					<button
						onClick={() => toast.dismiss(id)}
						className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-white text-sm"
					>
						No
					</button>
				</div>
			</div>,
			{
				position: 'bottom-right',
				autoClose: false,
				closeOnClick: false,
				closeButton: false,
			}
		);
	};

	const handleDelete = async (sessionId) => {
		const deleting = toast.loading('Deleting session...');
		const res = await fetch('/api/chat/delete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ sessionId }),
		});

		if (res.ok) {
			toast.update(deleting, {
				render: '✅ Session deleted',
				type: 'success',
				isLoading: false,
				autoClose: 2000,
			});
			fetchSessions();
		} else {
			const data = await res.json();
			toast.update(deleting, {
				render: `❌ ${data.error || 'Delete failed'}`,
				type: 'error',
				isLoading: false,
				autoClose: 3000,
			});
		}
	};

	return (
		<div className="bg-[#161b22] p-3 h-full flex flex-col overflow-hidden">
			<ToastContainer theme="dark" position="bottom-right" />
			<h2 className="text-white font-bold mb-4">🕘 Recent Sessions</h2>
			<div className="flex-1 overflow-y-auto pr-1 space-y-2">
				{sessions.map((s, i) => (
					<div
						key={i}
						className="bg-[#0d1117] hover:bg-gray-800 p-2 rounded flex justify-between items-start"
					>
						<div
							onClick={() => onSelect(s.sessionId)}
							className="flex-1 cursor-pointer overflow-hidden"
						>
							<p className="truncate whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
								{s.latestMessage || 'Empty session'}
							</p>
							<p className="text-xs text-gray-400 truncate">
								{new Date(s.createdAt).toLocaleString()}
							</p>
						</div>

						<button
							onClick={() => confirmDelete(s.sessionId)}
							className="text-red-400 hover:text-red-300 ml-2"
							title="Delete session"
						>
							<FiTrash2 size={16} />
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
