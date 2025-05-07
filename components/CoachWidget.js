'use client';
import { useState } from 'react';

export default function AlignerWidget() {
	const [input, setInput] = useState('');
	const [result, setResult] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async () => {
		if (!input.trim()) return;
		setLoading(true);
		setResult('');
		setError('');

		try {
			const res = await fetch('/api/aligner', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: input }),
			});

			const data = await res.json();
			if (res.ok) {
				setResult(data.output);
			} else {
				setError(data.error || 'Failed to get alignment');
			}
		} catch (err) {
			setError('Something went wrong');
		}

		setLoading(false);
	};

	return (
		<div className="bg-[#161b22] rounded-xl p-4 shadow-lg flex flex-col h-full">
			<h2 className="text-xl font-semibold mb-4">🧭 Aligner AI</h2>
			<textarea
				value={input}
				onChange={(e) => setInput(e.target.value)}
				className="bg-[#0d1117] text-white border border-gray-700 rounded-md p-3 resize-none min-h-[100px]"
				placeholder="What would you like aligned or optimized?"
			/>
			<button
				onClick={handleSubmit}
				disabled={loading || !input.trim()}
				className="mt-3 bg-[#238636] hover:bg-[#2ea043] text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
			>
				{loading ? 'Aligning...' : 'Align Now'}
			</button>

			{result && (
				<div className="mt-4 text-sm whitespace-pre-wrap bg-[#0d1117] border border-gray-700 p-3 rounded-md">
					{result}
				</div>
			)}

			{error && <p className="text-red-500 text-sm mt-2">{error}</p>}
		</div>
	);
}
