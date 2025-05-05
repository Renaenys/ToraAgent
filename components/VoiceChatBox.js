'use client';

import { useRef, useState } from 'react';
import { FiMic, FiStopCircle } from 'react-icons/fi';

export default function VoiceChatBox() {
	const [transcript, setTranscript] = useState('');
	const [isRecording, setIsRecording] = useState(false);
	const [audioUrl, setAudioUrl] = useState(null);
	const mediaRecorderRef = useRef(null);
	const audioChunksRef = useRef([]);
	const [sessionId] = useState(
		crypto.randomUUID?.() || Math.random().toString(36).substring(2)
	);

	const startRecording = async () => {
		setTranscript('');
		setAudioUrl(null);
		setIsRecording(true);
		audioChunksRef.current = [];

		if (
			typeof window === 'undefined' ||
			!navigator.mediaDevices?.getUserMedia
		) {
			alert('🎙️ Microphone not supported in this browser.');
			setIsRecording(false);
			return;
		}

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const mediaRecorder = new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			mediaRecorder.onstop = async () => {
				const audioBlob = new Blob(audioChunksRef.current, {
					type: 'audio/webm',
				});

				const formData = new FormData();
				formData.append('file', audioBlob, 'voice.webm');

				// 1️⃣ Get transcription from Whisper
				const whisperRes = await fetch('/api/whisper', {
					method: 'POST',
					body: formData,
				});

				const prompt = await whisperRes.text();
				setTranscript(prompt);

				// 2️⃣ Show in ChatBox via message injection
				const userMsg = { role: 'user', content: prompt };
				const placeholder = { role: 'assistant', content: '...' };
				window.dispatchEvent(
					new CustomEvent('voice-chat-msg', {
						detail: [userMsg, placeholder],
					})
				);

				// 3️⃣ Get AI reply
				const chatRes = await fetch('/api/chat/respond', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ prompt, sessionId }),
				});
				const { reply } = await chatRes.json();

				// 4️⃣ TTS
				const ttsRes = await fetch('/api/voice-chat', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ prompt: reply }),
				});

				const audioBuffer = await ttsRes.arrayBuffer();
				const audioBlobOut = new Blob([audioBuffer], { type: 'audio/mpeg' });
				const url = URL.createObjectURL(audioBlobOut);
				setAudioUrl(url);
				new Audio(url).play();

				// 5️⃣ Send final message to ChatBox
				window.dispatchEvent(
					new CustomEvent('voice-chat-msg', {
						detail: [{ role: 'assistant', content: reply }],
					})
				);
			};

			mediaRecorder.start();
		} catch (err) {
			console.error('❌ Error accessing mic:', err);
			alert('🎙️ Microphone access failed.');
			setIsRecording(false);
		}
	};

	const stopRecording = () => {
		setIsRecording(false);
		if (mediaRecorderRef.current) {
			mediaRecorderRef.current.stop();
		}
	};

	return (
		<div className="bg-[#161b22] rounded-xl p-4 shadow-lg text-white">
			<h2 className="text-lg font-semibold mb-2">🎙️ Voice Assistant (VIP2)</h2>
			<div className="flex items-center gap-4">
				<button
					className={`p-3 rounded-full ${
						isRecording ? 'bg-red-500' : 'bg-green-500 hover:bg-green-600'
					}`}
					onClick={isRecording ? stopRecording : startRecording}
				>
					{isRecording ? <FiStopCircle size={24} /> : <FiMic size={24} />}
				</button>
				<span className="text-sm text-gray-300">
					{isRecording ? 'Recording...' : transcript || 'Tap to speak'}
				</span>
			</div>

			{audioUrl && (
				<div className="mt-4">
					<audio controls src={audioUrl} />
				</div>
			)}
		</div>
	);
}
