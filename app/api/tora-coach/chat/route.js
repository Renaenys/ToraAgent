// /app/api/tora-coach/chat/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import CoachChat from '@/models/CoachChat';
import { chat } from '@/lib/langchain';

export async function POST(req) {
	try {
		await connectDB();
		const { userId, message } = await req.json();
		if (!userId || !message)
			return NextResponse.json(
				{ error: 'Missing userId or message' },
				{ status: 400 }
			);

		const history = (await CoachChat.findOne({ userId })) || {
			userId,
			messages: [],
		};
		history.messages.push({ sender: 'user', content: message });

		const result = await chat.invoke([
			[
				'system',
				'You are Tora Coach, the user’s AI growth mentor. Stay supportive, action-based, and clear.',
			],
			...history.messages.map((msg) => [
				msg.sender === 'user' ? 'user' : 'assistant',
				msg.content,
			]),
		]);

		const reply = result?.content || '...';

		history.messages.push({ sender: 'coach', content: reply });
		await CoachChat.findOneAndUpdate({ userId }, history, { upsert: true });

		return NextResponse.json({ reply });
	} catch (err) {
		console.error('❌ Chat error:', err);
		return NextResponse.json(
			{ error: 'Failed to send message' },
			{ status: 500 }
		);
	}
}

export async function GET(req) {
	try {
		await connectDB();
		const userId = req.nextUrl.searchParams.get('userId');
		if (!userId)
			return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

		const chat = await CoachChat.findOne({ userId });
		return NextResponse.json(chat?.messages || []);
	} catch (err) {
		return NextResponse.json({ error: 'Failed to load chat' }, { status: 500 });
	}
}
export async function DELETE(req) {
	await connectDB();
	const userId = req.nextUrl.searchParams.get('userId');
	await CoachChat.deleteOne({ userId });
	return NextResponse.json({ ok: true });
}
