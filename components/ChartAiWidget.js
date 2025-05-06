'use client';
import { useEffect, useState } from 'react';

const PAIRS = {
	BINANCE: [
		'BTCUSDT',
		'ETHUSDT',
		'BNBUSDT',
		'XRPUSDT',
		'ADAUSDT',
		'DOGEUSDT',
		'SOLUSDT',
		'MATICUSDT',
	],
	NASDAQ: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX'],
	OANDA: [
		'XAUUSD',
		'XAGUSD',
		'EURUSD',
		'USDJPY',
		'GBPUSD',
		'AUDUSD',
		'USDCAD',
		'USDCHF',
		'NZDUSD',
		'EURJPY',
	],
};

export default function ChartAiWidget() {
	const [exchange, setExchange] = useState('BINANCE');
	const [ticker, setTicker] = useState('');
	const [loading, setLoading] = useState(false);
	const [chart, setChart] = useState(null);
	const [analysis, setAnalysis] = useState('');
	const [error, setError] = useState('');
	const [usageLeft, setUsageLeft] = useState(3);

	useEffect(() => {
		const fetchUsage = async () => {
			try {
				const res = await fetch('/api/chart-ai/usage');
				const data = await res.json();
				setUsageLeft(data.usageLeft ?? 3);
			} catch {
				setUsageLeft(3);
			}
		};
		fetchUsage();
	}, []);

	const suggestions = PAIRS[exchange] || [];

	const handleSubmit = async () => {
		if (usageLeft <= 0) {
			setError('❌ Daily limit reached. Try again tomorrow.');
			return;
		}
		if (!ticker.trim()) {
			setError('Please select a pair.');
			return;
		}

		setLoading(true);
		setError('');
		setChart(null);
		setAnalysis('');

		try {
			const fullTicker = `${exchange}:${ticker}`;

			const res = await fetch('/api/chart-ai', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ticker: fullTicker }),
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
			<div className="flex justify-between items-center">
				<p className="text-sm text-gray-400">
					Uses Left Today: <span className="font-bold">{usageLeft}/3</span>
				</p>
				<div className="flex gap-2">
					{['BINANCE', 'NASDAQ', 'OANDA'].map((ex) => (
						<button
							key={ex}
							onClick={() => {
								setExchange(ex);
								setTicker('');
							}}
							className={`px-2 py-1 text-sm rounded ${
								exchange === ex
									? 'bg-blue-600 text-white'
									: 'bg-gray-700 hover:bg-gray-600'
							}`}
						>
							{ex}
						</button>
					))}
				</div>
			</div>

			<div className="flex items-center gap-2">
				<select
					value={ticker}
					onChange={(e) => setTicker(e.target.value)}
					className="bg-[#0d1117] border border-gray-700 rounded px-3 py-2 text-white w-full"
				>
					<option value="">Select a pair</option>
					{suggestions.map((pair) => (
						<option key={pair} value={pair}>
							{pair}
						</option>
					))}
				</select>

				<button
					onClick={handleSubmit}
					disabled={loading || usageLeft <= 0}
					className={`px-4 py-2 rounded text-sm font-medium ${
						usageLeft <= 0
							? 'bg-gray-600 cursor-not-allowed'
							: 'bg-green-600 hover:bg-green-700'
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
