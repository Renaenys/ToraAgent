import { NextResponse } from 'next/server';

export async function POST(req) {
	const formData = await req.formData();
	formData.append('model', 'whisper-1'); // ✅ REQUIRED
	formData.append('response_format', 'text');

	try {
		const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			},
			body: formData,
		});
		const text = await res.text();
		return new NextResponse(text);
	} catch (err) {
		console.error('Whisper error:', err);
		return NextResponse.json({ error: 'Whisper failed' }, { status: 500 });
	}
}
