// app/api/aligner/route.js
import { NextResponse } from 'next/server';
import { chat } from '@/lib/langchain';

export async function POST(req) {
	try {
		const { prompt } = await req.json();
		if (!prompt) {
			return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
		}

		const result = await chat.invoke([
			[
				'system',
				'You are an alignment assistant. Help the user optimize or reframe their idea.',
			],
			['user', prompt],
		]);

		return NextResponse.json({ output: result?.content || 'No output' });
	} catch (err) {
		console.error('❌ Aligner Error:', err);
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		);
	}
}
