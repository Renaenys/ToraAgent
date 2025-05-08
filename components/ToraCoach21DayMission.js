'use client';
import { useEffect, useState } from 'react';

export default function ToraCoach21DayMission({ userId }) {
	const [loading, setLoading] = useState(true);
	const [missions, setMissions] = useState([]);
	const [completed, setCompleted] = useState([]);
	const [dateKey, setDateKey] = useState('');
	const [day, setDay] = useState(1);

	useEffect(() => {
		if (!userId) return;

		const today = new Date().toISOString().slice(0, 10);
		setDateKey(today);

		const load = async () => {
			setLoading(true);
			const res = await fetch(
				`/api/tora-coach/progress-missions?userId=${userId}`
			);
			const data = await res.json();

			if (data?.today?.length > 0) {
				setMissions(data.today);
				setDay(data.day || 1);
				setCompleted(data.today.map((m) => m.completed || false));
			} else {
				setMissions([]);
			}

			setLoading(false);
		};

		load();
	}, [userId]);

	const handleCheck = async (idx) => {
		const newChecked = [...completed];
		newChecked[idx] = !newChecked[idx];

		const updated = missions.map((m, i) => ({
			...m,
			completed: newChecked[i],
			timestamp: newChecked[i] ? new Date().toLocaleTimeString() : '',
		}));

		await fetch('/api/tora-coach/progress-missions', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId, date: dateKey, missions: updated }),
		});

		setCompleted(newChecked);
		setMissions(updated);
	};

	if (loading) {
		return (
			<div className="text-white bg-[#161b22] p-4 rounded-lg border border-gray-700 text-sm">
				Loading mission...
			</div>
		);
	}

	if (missions.length === 0) {
		return (
			<div className="bg-[#161b22] text-white p-6 rounded-lg border border-gray-700">
				<p className="text-gray-400">⚠️ No mission available today.</p>
			</div>
		);
	}

	return (
		<div className="bg-[#161b22] text-white p-6 rounded-lg border border-green-700 space-y-4">
			<h3 className="text-xl font-bold text-green-400">
				📅 Day {day} Missions
			</h3>

			<ul className="space-y-4">
				{missions.map((m, idx) => (
					<li key={idx} className="border-t border-gray-700 pt-3">
						<h4 className="text-md font-semibold">🟢 {m.text}</h4>
						<div className="flex items-center gap-2 mt-2">
							<input
								type="checkbox"
								checked={completed[idx]}
								onChange={() => handleCheck(idx)}
								className="accent-green-500"
							/>
							<span
								className={
									completed[idx] ? 'line-through text-gray-400' : 'text-white'
								}
							>
								{completed[idx] ? 'Completed!' : 'Mark as done'}
							</span>
						</div>
						{m.timestamp && (
							<p className="text-xs text-gray-500">✅ Done at {m.timestamp}</p>
						)}
					</li>
				))}
			</ul>

			<div className="mt-4">
				<div className="text-sm text-gray-400 mb-1">
					🔥 Progress: {completed.filter(Boolean).length}/3 tasks complete
				</div>
				<div className="h-2 w-full bg-gray-800 rounded">
					<div
						className="h-2 bg-green-500 rounded"
						style={{
							width: `${(completed.filter(Boolean).length / 3) * 100}%`,
						}}
					/>
				</div>
			</div>
		</div>
	);
}
