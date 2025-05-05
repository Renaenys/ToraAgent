import { useEffect, useState } from 'react';

export default function ChartAiWidget() {
	const [ticker, setTicker] = useState('BTCUSDT');
	const [loading, setLoading] = useState(false);
	const [chart, setChart] = useState(null);
	const [analysis, setAnalysis] = useState('');
	const [error, setError] = useState('');
	const [usageLeft, setUsageLeft] = useState(3);

	useEffect(() => {
		// Fetch real-time usage from DB
		const fetchUsage = async () => {
			try {
				const res = await fetch('/api/chart-ai/usage');
				const data = await res.json();
				setUsageLeft(data.usageLeft ?? 3);
			} catch {
				setUsageLeft(3); // fallback if server fails
			}
		};
		fetchUsage();
	}, []);

	const handleSubmit = async () => {
		if (usageLeft <= 0) {
			setError('❌ Daily limit reached. Try again tomorrow.');
			return;
		}

		setLoading(true);
		setError('');
		setChart(null);
		setAnalysis('');

		try {
			const res = await fetch('/api/chart-ai', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ticker: ticker.toUpperCase() }),
			});

			const data = await res.json();

			if (!res.ok) throw new Error(data.error || 'Something went wrong');

			setChart(`data:image/png;base64,${data.image}`);
			setAnalysis(data.analysis);
			setUsageLeft(data.usageLeft ?? usageLeft - 1);
		} catch (err) {
			setError(err.message);
		}

		setLoading(false);
	};

	return (
		<div className="bg-[#161b22] text-white rounded-xl p-4 shadow-lg w-full space-y-4">
			<p className="text-sm text-gray-400">
				Uses Left Today: <span className="font-bold">{usageLeft}/3</span>
			</p>

			<div className="flex items-center gap-2">
				<input
					type="text"
					value={ticker}
					onChange={(e) => setTicker(e.target.value)}
					placeholder="e.g. BTCUSDT"
					className="bg-[#0d1117] border border-gray-700 rounded px-3 py-2 w-full text-white"
				/>
				<button
					onClick={handleSubmit}
					disabled={loading || usageLeft <= 0}
					className={`px-4 py-2 rounded text-sm font-medium ${
						usageLeft <= 0
							? 'bg-gray-600 cursor-not-allowed'
							: 'bg-blue-600 hover:bg-blue-700'
					}`}
				>
					{loading ? 'Loading...' : 'Generate'}
				</button>
			</div>

			{error && <p className="text-red-500 text-sm">{error}</p>}
			{chart && (
				<div className="rounded overflow-hidden border border-gray-700">
					<img src={chart} alt="Chart AI" className="w-full" />
				</div>
			)}
			{analysis && (
				<div className="bg-black/50 border border-gray-700 rounded p-4 text-sm whitespace-pre-wrap font-mono">
					{analysis}
				</div>
			)}
		</div>
	);
}
