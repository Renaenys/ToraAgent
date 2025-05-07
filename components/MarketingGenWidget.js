'use client';

import { useEffect, useState, useRef } from 'react';

export default function MarketingGenWidget() {
	const [prompt, setPrompt] = useState('');
	const [upload, setUpload] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [generatedImage, setGeneratedImage] = useState(null);
	const [generatedText, setGeneratedText] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [usageLeft, setUsageLeft] = useState(3);
	const fileInputRef = useRef(null);

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

	const handleDownload = () => {
		if (!generatedImage) return;
		const link = document.createElement('a');
		link.href = generatedImage;
		link.download = 'generated-image.png';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<div className="flex flex-col gap-6 text-white w-full max-h-[calc(100vh-6rem)] overflow-auto">
			{/* Usage Info */}
			<div className="text-sm text-gray-400">
				Uses Left Today: <span className="font-bold">{usageLeft}/3</span>
			</div>

			{/* Prompt Input */}
			<div>
				<label className="block text-sm mb-1">Describe your product or audience:</label>
				<textarea
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder="E.g. Stylish phone case for Gen Z travelers..."
					rows={4}
					className="bg-[#0d1117] border border-gray-700 rounded px-3 py-2 w-full text-sm"
				/>
			</div>

			{/* Upload + Generate Button */}
			<div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
				{/* Upload Button */}
				<div className="flex items-center">
					<button
						type="button"
						onClick={() => fileInputRef.current.click()}
						className="bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded"
					>
						📁 Upload Image
					</button>
					<span className="ml-3 text-xs text-gray-400">
						{upload ? upload.name : 'No file chosen'}
					</span>
					<input
						type="file"
						accept="image/*"
						ref={fileInputRef}
						onChange={handleUpload}
						className="hidden"
					/>
				</div>

				{/* Generate Button */}
				<button
					onClick={handleGenerate}
					disabled={loading || usageLeft <= 0}
					className={`px-4 py-2 rounded text-sm font-medium transition-all ${
						loading || usageLeft <= 0
							? 'bg-gray-600 cursor-not-allowed'
							: 'bg-green-600 hover:bg-green-700'
					}`}
				>
					{loading ? 'Generating...' : '🚀 Generate'}
				</button>
			</div>

			{/* Error Message */}
			{error && <p className="text-red-500 text-sm">{error}</p>}

			{/* Generated Text */}
			{generatedText && (
				<div className="bg-[#1c1f26] border border-gray-700 rounded p-4 text-sm whitespace-pre-wrap font-mono">
					<h3 className="font-semibold text-white mb-2 text-base">📝 Generated Copy</h3>
					{generatedText}
				</div>
			)}

			{/* Image Display */}
			{generatedImage && (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 w-full">
					{previewUrl && (
						<div className="flex flex-col items-center w-full">
							<p className="text-xs text-gray-400 mb-2">Uploaded Image</p>
							<img
								src={previewUrl}
								alt="Uploaded"
								className="rounded border border-gray-700 w-full max-w-full object-contain max-h-[300px]"
							/>
						</div>
					)}
					<div className="flex flex-col items-center w-full">
						<p className="text-xs text-gray-400 mb-2">Generated Image</p>
						<img
							src={generatedImage}
							alt="Generated"
							className="rounded border border-gray-700 w-full max-w-full object-contain max-h-[300px]"
						/>
						<button
							onClick={handleDownload}
							className="mt-3 px-4 py-1 rounded text-xs bg-blue-600 hover:bg-blue-700 transition"
						>
							⬇️ Download Image
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
