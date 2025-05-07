// /app/api/tora-coach/session/route.js
import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import CoachSession from '@/models/CoachSession';

export async function GET(req) {
	try {
		await connectDB();
		const userId = req.nextUrl.searchParams.get('userId');
		if (!userId)
			return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

		const sessions = await CoachSession.find({ userId }).sort({
			createdAt: -1,
		});
		return NextResponse.json(sessions);
	} catch (err) {
		return NextResponse.json(
			{ error: 'Failed to fetch sessions' },
			{ status: 500 }
		);
	}
}
export async function DELETE(req) {
	await connectDB();
	const userId = req.nextUrl.searchParams.get('userId');
	await CoachSession.deleteMany({ userId });
	return NextResponse.json({ ok: true });
}
