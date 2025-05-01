import dbConnect from '@/lib/dbConnect';
import ChatHistory from '@/models/ChatHistory';
import { NextResponse } from 'next/server';

export async function POST(req) {
	const { sessionId } = await req.json();
	if (!sessionId) {
		return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
	}

	await dbConnect();
	const chat = await ChatHistory.findOne({ sessionId });
	if (!chat) {
		return NextResponse.json({ error: 'Session not found' }, { status: 404 });
	}

	return NextResponse.json({
		sessionId: chat.sessionId,
		messages: chat.messages,
	});
}
