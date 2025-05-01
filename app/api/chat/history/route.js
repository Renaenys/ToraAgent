// ✅ app/api/chat/history/route.js
import dbConnect from '@/lib/dbConnect';
import ChatHistory from '@/models/ChatHistory';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function GET(req) {
	try {
		// 1️⃣ Verify user via token
		const token = await getToken({ req });
		if (!token || !token.sub) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		// 2️⃣ Connect DB and query user sessions
		await dbConnect();
		const logs = await ChatHistory.find({ userId: token.sub })
			.sort({ createdAt: -1 })
			.limit(10)
			.lean();

		// 3️⃣ Return logs (trim content to preview optional)
		return NextResponse.json({
			logs: logs.map((log) => ({
				sessionId: log.sessionId,
				createdAt: log.createdAt,
				latestMessage:
					log.messages?.length > 0
						? log.messages[log.messages.length - 1].content.slice(0, 100)
						: 'No messages',
			})),
		});
	} catch (err) {
		console.error('❌ Chat history error:', err);
		return NextResponse.json(
			{ error: err.message || 'Failed to load chat history' },
			{ status: 500 }
		);
	}
}
