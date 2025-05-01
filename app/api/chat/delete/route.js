import dbConnect from '@/lib/dbConnect';
import ChatHistory from '@/models/ChatHistory';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function POST(req) {
	const token = await getToken({ req });
	if (!token) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	await dbConnect();
	const { sessionId } = await req.json();

	const deleted = await ChatHistory.deleteOne({
		sessionId,
		userId: token.sub,
	});

	if (deleted.deletedCount === 0) {
		return NextResponse.json({ error: 'Session not found' }, { status: 404 });
	}

	return NextResponse.json({ success: true });
}
