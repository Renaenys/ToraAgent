import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Briefing from '@/models/Briefing';

export async function POST(req) {
	try {
		const { email } = await req.json();
		if (!email) {
			return NextResponse.json({ error: 'Missing email' }, { status: 400 });
		}

		await dbConnect();
		const today = new Date().toISOString().split('T')[0];

		const briefing = await Briefing.findOne({ email, date: today });

		if (!briefing) {
			return NextResponse.json({ summary: null });
		}

		return NextResponse.json({ summary: briefing.summary });
	} catch (err) {
		console.error('❌ Briefing fetch error:', err);
		return NextResponse.json(
			{ error: 'Failed to fetch briefing' },
			{ status: 500 }
		);
	}
}
