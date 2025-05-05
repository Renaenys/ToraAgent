import { NextResponse } from 'next/server';

export async function POST(req) {
	const { prompt } = await req.json();

	if (!prompt) {
		return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
	}

	try {
		const res = await fetch('https://api.openai.com/v1/audio/speech', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'tts-1-hd',
				voice: 'nova',
				input: prompt,
			}),
		});

		const buffer = await res.arrayBuffer();
		return new NextResponse(Buffer.from(buffer), {
			headers: { 'Content-Type': 'audio/mpeg' },
		});
	} catch (err) {
		console.error('TTS error:', err);
		return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
	}
}
