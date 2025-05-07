import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import CoachMissionSequence from '@/models/CoachMissionSequence';

export async function GET(req) {
	await connectDB();
	const userId = req.nextUrl.searchParams.get('userId');
	if (!userId)
		return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

	const data = await CoachMissionSequence.findOne({ userId });
	if (!data)
		return NextResponse.json(
			{ error: 'No mission plan found' },
			{ status: 404 }
		);

	const dayIndex = Math.floor(
		(Date.now() - new Date(data.createdAt)) / 86400000
	);
	if (dayIndex >= 21) {
		return NextResponse.json({ status: 'complete', missions: data.missions });
	}

	const todayMissions = data.missions.filter((m) => m.day === dayIndex + 1);
	return NextResponse.json({ today: todayMissions, day: dayIndex + 1 });
}

export async function PATCH(req) {
	await connectDB();
	const { userId, day, missionIndex } = await req.json();

	if (!userId || !day)
		return NextResponse.json(
			{ error: 'Missing userId or day' },
			{ status: 400 }
		);

	const updated = await CoachMissionSequence.findOneAndUpdate(
		{ userId },
		{
			$set: {
				[`missions.${(day - 1) * 3 + missionIndex}.completed`]: true,
				[`missions.${(day - 1) * 3 + missionIndex}.completedAt`]:
					new Date().toLocaleTimeString(),
			},
		},
		{ new: true }
	);

	return NextResponse.json({ ok: true, updated });
}

export async function DELETE(req) {
	await connectDB();
	const userId = req.nextUrl.searchParams.get('userId');
	if (!userId)
		return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

	await CoachMissionSequence.deleteOne({ userId });
	return NextResponse.json({ ok: true });
}
