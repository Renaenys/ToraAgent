import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import CoachProfile from '@/models/CoachProfile';

export async function POST(req) {
	try {
		await connectDB();
		const { userId, ...data } = await req.json();
		if (!userId)
			return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

		const updated = await CoachProfile.findOneAndUpdate({ userId }, data, {
			new: true,
			upsert: true,
		});

		return NextResponse.json(updated);
	} catch (err) {
		return NextResponse.json(
			{ error: 'Failed to save profile' },
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

		const profile = await CoachProfile.findOne({ userId });
		return NextResponse.json(profile || {});
	} catch (err) {
		return NextResponse.json(
			{ error: 'Failed to fetch profile' },
			{ status: 500 }
		);
	}
}

export async function DELETE(req) {
	await connectDB();
	const userId = req.nextUrl.searchParams.get('userId');
	await CoachProfile.deleteOne({ userId });
	return NextResponse.json({ ok: true });
}
