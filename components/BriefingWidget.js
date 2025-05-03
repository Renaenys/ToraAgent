'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FiRefreshCw } from 'react-icons/fi';

export default function BriefingWidget() {
	const { data: session } = useSession();
	const [summary, setSummary] = useState('');
	const [loading, setLoading] = useState(false);
	const [updating, setUpdating] = useState(false);

	// 🔄 Load summary on mount
	useEffect(() => {
		if (session?.user?.email) {
			fetchSummary(session.user.email);
		}
	}, [session]);

	const fetchSummary = async (email) => {
		setLoading(true);
		const res = await fetch('/api/briefing/user', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email }),
		});
		const data = await res.json();
		setSummary(data.summary || 'No summary available.');
		setLoading(false);
	};

	const handleRefresh = async () => {
		if (!session?.user?.email) return;

		setUpdating(true);

		await fetch('/api/briefing/update', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: session.user.email }),
		});

		await fetchSummary(session.user.email);
		setUpdating(false);
	};

	return (
		<div className="text-white">
			<div className="flex justify-between items-center mb-2">
				<h2 className="text-xl font-semibold">📋 Daily Briefing</h2>
				<button
					onClick={handleRefresh}
					disabled={updating}
					className={`flex items-center gap-2 px-3 py-1 text-sm rounded ${
						updating ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
					}`}
				>
					<FiRefreshCw className={updating ? 'animate-spin' : ''} />
					{updating ? 'Refreshing...' : 'Refresh'}
				</button>
			</div>

			<div className="bg-[#0f172a] p-4 rounded-lg text-sm whitespace-pre-wrap border border-blue-500 max-h-60 overflow-y-auto">
				{loading ? 'Loading summary...' : summary}
			</div>
		</div>
	);
}
