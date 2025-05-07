import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import CoachMissionLog from '@/models/CoachMissionLog';

// GET ?userId=...&date=YYYY-MM-DD
export async function GET(req) {
	await connectDB();
	const userId = req.nextUrl.searchParams.get('userId');
	const date = req.nextUrl.searchParams.get('date');

	if (!userId || !date) {
		return NextResponse.json(
			{ error: 'Missing userId or date' },
			{ status: 400 }
		);
	}

	const log = await CoachMissionLog.findOne({ userId, date });
	return NextResponse.json(log || {});
}

// PATCH to update completion
export async function PATCH(req) {
	await connectDB();
	const { userId, date, missions } = await req.json();

	if (!userId || !date || !missions) {
		return NextResponse.json({ error: 'Missing data' }, { status: 400 });
	}

	const updated = await CoachMissionLog.findOneAndUpdate(
		{ userId, date },
		{ missions },
		{ upsert: true, new: true }
	);

	return NextResponse.json(updated);
}

// DELETE ?userId=...&date=YYYY-MM-DD
export async function DELETE(req) {
	await connectDB();
	const userId = req.nextUrl.searchParams.get('userId');
	const date = req.nextUrl.searchParams.get('date');

	if (!userId || !date) {
		return NextResponse.json(
			{ error: 'Missing userId or date' },
			{ status: 400 }
		);
	}

	await CoachMissionLog.deleteOne({ userId, date });
	return NextResponse.json({ ok: true });
}
