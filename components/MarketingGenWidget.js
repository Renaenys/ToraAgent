'use client';

import { useEffect, useState } from 'react';

export default function MarketingGenWidget() {
	const [prompt, setPrompt] = useState('');
	const [upload, setUpload] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [generatedImage, setGeneratedImage] = useState(null);
	const [generatedText, setGeneratedText] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [usageLeft, setUsageLeft] = useState(3);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch('/api/marketing-gen/usage');
				const data = await res.json();
				setUsageLeft(data.usageLeft ?? 3);
			} catch {
				setUsageLeft(3);
			}
		})();
	}, []);

	const handleUpload = (e) => {
		const file = e.target.files[0];
		setUpload(file);
		if (file) {
			setPreviewUrl(URL.createObjectURL(file));
		}
	};

	const handleGenerate = async () => {
		if (!prompt.trim()) return;
		if (usageLeft <= 0) {
			setError('❌ Daily usage limit reached.');
			return;
		}

		setLoading(true);
		setError('');
		setGeneratedImage(null);
		setGeneratedText('');

		try {
			const formData = new FormData();
			formData.append('prompt', prompt);
			if (upload) formData.append('image', upload);

			const res = await fetch('/api/marketing-gen', {
				method: 'POST',
				body: formData,
			});
			const data = await res.json();

			if (!res.ok) throw new Error(data.error || 'Something went wrong.');

			setGeneratedText(data.text);
			setGeneratedImage(data.image);
			setUsageLeft(data.usageLeft ?? usageLeft - 1);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col gap-4 text-white w-full max-h-[calc(100vh-6rem)] overflow-auto">
			<p className="text-sm text-gray-400">
				Uses Left Today: <span className="font-bold">{usageLeft}/3</span>
			</p>

			<textarea
				value={prompt}
				onChange={(e) => setPrompt(e.target.value)}
				placeholder="Describe your product, audience, or offer..."
				rows={4}
				className="bg-[#0d1117] border border-gray-700 rounded px-3 py-2 w-full text-sm"
			/>

			<div className="flex items-center gap-2">
				<input
					type="file"
					accept="image/*"
					onChange={handleUpload}
					className="text-sm text-gray-300"
				/>
				<button
					onClick={handleGenerate}
					disabled={loading || usageLeft <= 0}
					className={`px-4 py-2 rounded text-sm font-medium ${
						loading || usageLeft <= 0
							? 'bg-gray-600 cursor-not-allowed'
							: 'bg-green-600 hover:bg-green-700'
					}`}
				>
					{loading ? 'Generating...' : 'Generate'}
				</button>
			</div>

			{error && <p className="text-red-500 text-sm">{error}</p>}

			{generatedText && (
				<div className="bg-black/40 border border-gray-700 rounded p-4 text-sm whitespace-pre-wrap font-mono">
					{generatedText}
				</div>
			)}

			{generatedImage && (
				<div className="flex gap-4 flex-col md:flex-row">
					{previewUrl && (
						<div className="flex-1 text-center space-y-1">
							<p className="text-xs text-gray-400">Uploaded Image</p>
							<img
								src={previewUrl}
								alt="Uploaded"
								className="rounded border border-gray-700 w-full"
							/>
						</div>
					)}
					<div className="flex-1 text-center space-y-1">
						<p className="text-xs text-gray-400">Generated Image</p>
						<img
							src={generatedImage}
							alt="Generated"
							className="rounded border border-gray-700 w-full"
						/>
					</div>
				</div>
			)}
		</div>
	);
}
