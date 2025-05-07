'use client';
import { useEffect, useState } from 'react';

export default function ToraCoachMissions({ output, userId }) {
	const [missions, setMissions] = useState([]);
	const [checked, setChecked] = useState([]);
	const [completed, setCompleted] = useState([]);
	const [dateKey, setDateKey] = useState('');

	useEffect(() => {
		const today = new Date().toISOString().slice(0, 10);
		setDateKey(today);

		const lines = output?.split('\n') || [];

		// ✅ Enhanced bullet detection: handles *, -, •, ✳️, ✅ and emoji prefixed items
		const extracted = lines
			.map((line) => line.trim())
			.filter((line) => /^(\*|-|•|✳️|✅|\d+\.)\s+/.test(line))
			.map((line) => line.replace(/^(\*|-|•|✳️|✅|\d+\.)\s+/, '').trim())
			.filter((line) => line.length > 0)
			.slice(0, 3); // ✅ only take first 3 items per day

		setMissions(extracted);

		if (userId && extracted.length > 0) {
			fetch(`/api/tora-coach/missions?userId=${userId}&date=${today}`)
				.then((res) => res.json())
				.then((data) => {
					if (data?.missions?.length === extracted.length) {
						setChecked(data.missions.map((m) => !!m.completed));
						setCompleted(data.missions.map((m) => m.timestamp || null));
					} else {
						setChecked(new Array(extracted.length).fill(false));
						setCompleted(new Array(extracted.length).fill(null));
					}
				});
		}
	}, [output, userId]);

	const handleCheck = async (idx) => {
		const newChecked = [...checked];
		const newTimestamps = [...completed];

		newChecked[idx] = !newChecked[idx];
		newTimestamps[idx] = newChecked[idx]
			? new Date().toLocaleTimeString()
			: null;

		setChecked(newChecked);
		setCompleted(newTimestamps);

		await fetch('/api/tora-coach/missions', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				userId,
				date: dateKey,
				missions: missions.map((text, i) => ({
					text,
					completed: newChecked[i],
					timestamp: newTimestamps[i] || '',
				})),
			}),
		});
	};

	const handleReset = async () => {
		await fetch(`/api/tora-coach/missions?userId=${userId}&date=${dateKey}`, {
			method: 'DELETE',
		});
		setChecked(new Array(missions.length).fill(false));
		setCompleted(new Array(missions.length).fill(null));
	};

	if (missions.length === 0) {
		return (
			<div className="text-yellow-400 border border-yellow-500 bg-[#161b22] p-4 rounded-md text-sm">
				⚠️ No missions detected in output.
			</div>
		);
	}

	const percentComplete =
		(checked.filter(Boolean).length / (missions.length || 1)) * 100;

	return (
		<div className="bg-[#0d1117] p-4 rounded-md border border-green-700 space-y-4">
			<div className="flex justify-between items-center">
				<h3 className="text-green-400 text-lg font-semibold">
					📌 Missions for Today
				</h3>
				<span className="text-sm text-gray-400">
					{checked.filter(Boolean).length}/{missions.length} done
				</span>
			</div>

			<div className="h-2 w-full bg-gray-700 rounded">
				<div
					className="h-2 bg-green-500 rounded"
					style={{ width: `${percentComplete}%` }}
				/>
			</div>

			<ul className="space-y-2">
				{missions.map((mission, idx) => (
					<li key={idx} className="flex items-start gap-3">
						<input
							type="checkbox"
							checked={!!checked[idx]} // avoid uncontrolled to controlled warning
							onChange={() => handleCheck(idx)}
							className="accent-green-500 mt-1"
						/>
						<div>
							<p
								className={
									checked[idx] ? 'text-gray-500 line-through' : 'text-white'
								}
							>
								{mission}
							</p>
							{completed[idx] && (
								<p className="text-xs text-gray-400">
									✅ Completed at {completed[idx]}
								</p>
							)}
						</div>
					</li>
				))}
			</ul>

			<div className="flex justify-end mt-3">
				<button
					onClick={handleReset}
					className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white"
				>
					🗑 Reset Today’s Missions
				</button>
			</div>
		</div>
	);
}
