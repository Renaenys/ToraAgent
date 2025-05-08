import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import CoachChat from '@/models/CoachChat';
import CoachSession from '@/models/CoachSession';
import CoachProfile from '@/models/CoachProfile';
import { chat } from '@/lib/langchain';

export async function POST(req) {
	try {
		await connectDB();
		const { userId, message } = await req.json();

		if (!userId || !message) {
			return NextResponse.json(
				{ error: 'Missing userId or message' },
				{ status: 400 }
			);
		}

		// Load history
		const history = (await CoachChat.findOne({ userId })) || {
			userId,
			messages: [],
		};

		history.messages.push({ sender: 'user', content: message });

		// Load context
		const session = await CoachSession.findOne({ userId }).sort({
			createdAt: -1,
		});
		const profile = await CoachProfile.findOne({ userId });

		const systemContext = `
You are Tora Coach, the user’s AI growth mentor.

This is the user's current growth profile:
${profile ? JSON.stringify(profile, null, 2) : 'No profile found'}

This is the user's 21-day mission plan summary:
${session?.output || 'No mission plan found'}

Always be supportive, action-based, and focused. When asked, refer back to the plan or profile where useful.
		`.trim();

		// Generate AI response
		const result = await chat.invoke([
			['system', systemContext],
			...history.messages.map((msg) => [
				msg.sender === 'user' ? 'user' : 'assistant',
				msg.content,
			]),
		]);

		const reply = result?.content || '...';

		// Save to history
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
		if (!userId) {
			return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
		}

		const chat = await CoachChat.findOne({ userId });
		return NextResponse.json(chat?.messages || []);
	} catch (err) {
		console.error('❌ Failed to fetch chat history:', err);
		return NextResponse.json({ error: 'Failed to load chat' }, { status: 500 });
	}
}

export async function DELETE(req) {
	await connectDB();
	const userId = req.nextUrl.searchParams.get('userId');
	await CoachChat.deleteOne({ userId });
	return NextResponse.json({ ok: true });
}
