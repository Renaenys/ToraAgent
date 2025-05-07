'use client';
import { useEffect, useState } from 'react';

export default function ToraCoach21DayMission({ userId }) {
	const [loading, setLoading] = useState(true);
	const [missions, setMissions] = useState([]);
	const [allMissions, setAllMissions] = useState([]);
	const [todayIndex, setTodayIndex] = useState(0);

	useEffect(() => {
		if (!userId) return;

		const load = async () => {
			setLoading(true);
			const res = await fetch(
				`/api/tora-coach/progress-missions?userId=${userId}`
			);
			const data = await res.json();

			if (data.status === 'complete') {
				setAllMissions(data.missions || []);
				setMissions([]);
			} else {
				setMissions(data.today || []);
				setTodayIndex(data.day - 1);
			}

			setLoading(false);
		};

		load();
	}, [userId]);

	const handleComplete = async (day, index) => {
		await fetch('/api/tora-coach/progress-missions', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId, day }),
		});
		setMissions((prev) =>
			prev.map((m, i) =>
				i === index
					? {
							...m,
							completed: true,
							completedAt: new Date().toLocaleTimeString(),
					  }
					: m
			)
		);
	};

	const streak = allMissions.filter((m) => m.completed).length || todayIndex;

	if (loading) {
		return (
			<div className="text-white bg-[#161b22] p-4 rounded-lg border border-gray-700 text-sm">
				Loading mission...
			</div>
		);
	}

	if (missions.length === 0 && allMissions.length === 21) {
		return (
			<div className="bg-[#161b22] text-white p-6 rounded-lg border border-yellow-500 space-y-4">
				<h3 className="text-xl font-bold text-yellow-400">
					🎉 Challenge Complete!
				</h3>
				<p>
					You’ve completed all 21 missions! Ask Tora Coach for your final
					transformation summary.
				</p>
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
				📅 Day {todayIndex + 1} Missions
			</h3>

			{missions.map((m, idx) => (
				<div key={idx} className="mt-3 border-t border-gray-700 pt-3">
					<h4 className="text-md font-semibold text-green-400">🗓 {m.text}</h4>
					<div className="flex items-center gap-2 mt-2">
						<input
							type="checkbox"
							checked={m.completed}
							onChange={() => handleComplete(m.day, idx)}
							className="accent-green-500"
							disabled={m.completed}
						/>
						<span
							className={
								m.completed ? 'line-through text-gray-400' : 'text-white'
							}
						>
							{m.completed ? 'Completed!' : 'Mark as done'}
						</span>
					</div>
				</div>
			))}

			<div className="mt-4">
				<div className="text-sm text-gray-400 mb-1">
					🔥 Progress: {streak}/21 days complete
				</div>
				<div className="h-2 w-full bg-gray-800 rounded">
					<div
						className="h-2 bg-green-500 rounded"
						style={{ width: `${(streak / 21) * 100}%` }}
					/>
				</div>
			</div>
		</div>
	);
}
