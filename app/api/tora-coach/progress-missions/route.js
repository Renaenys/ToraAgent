import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import CoachMissionLog from '@/models/CoachMissionLog';
import CoachSession from '@/models/CoachSession';
import { chat } from '@/lib/langchain';

function getToday() {
	const now = new Date();
	return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function GET(req) {
	await connectDB();
	const userId = req.nextUrl.searchParams.get('userId');
	if (!userId)
		return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

	const today = getToday();

	// Check if today's missions already exist
	let log = await CoachMissionLog.findOne({ userId, date: today });
	if (log) return NextResponse.json({ today: log.missions, day: today });

	// Load coaching summary from session
	const session = await CoachSession.findOne({ userId }).sort({
		createdAt: -1,
	});
	if (!session?.output)
		return NextResponse.json(
			{ error: 'No plan summary found' },
			{ status: 404 }
		);

	// Calculate current day in sequence
	const dayNumber =
		Math.floor((Date.now() - new Date(session.createdAt)) / 86400000) + 1;
	if (dayNumber > 21)
		return NextResponse.json({ status: 'complete', day: dayNumber });

	// Ask Langchain to generate 3 missions
	const prompt = `
You are Tora Coach — an AI mentor built by Tora.now.

Analyze the user's intake form and quiz responses below. Identify:
1. Their motivation type and blockers
2. Assign a coaching persona (e.g., Focused Strategist, Stuck Soloist, Curious Builder)
3. Choose their primary coaching mode (Growth, Business, Investment)
4. Select a goal framework (SMART, WOOP, OKR, etc.)
5. Identify 2–3 Tora archetypes that match their mindset
6. Generate a 21-day coaching plan summary (for use in daily mission generation)

Output only:
* Persona: ...
* Coaching Mode: ...
* Goal Framework: ...
* Archetypes: ...
* Plan Summary:
...
Plan Summary:
${session.output}
`.trim();

	const result = await chat.invoke([
		['system', 'You are Tora Coach, keep responses focused and actionable.'],
		['user', prompt],
	]);

	const content = result?.content || '';
	const lines = content
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => /^(\*|-|\d+\.)\s+/.test(line))
		.map((line) => line.replace(/^(\*|-|\d+\.)\s+/, '').trim())
		.filter((line) => line.length > 0)
		.slice(0, 3);

	if (lines.length === 0) {
		return NextResponse.json(
			{ error: 'AI did not return valid missions' },
			{ status: 422 }
		);
	}

	// Save to DB
	log = await CoachMissionLog.findOneAndUpdate(
		{ userId, date: today },
		{
			userId,
			date: today,
			missions: lines.map((text) => ({
				text,
				completed: false,
				timestamp: '',
			})),
		},
		{ upsert: true, new: true }
	);

	return NextResponse.json({ today: log.missions, day: dayNumber });
}

export async function PATCH(req) {
	await connectDB();
	const { userId, date, missions } = await req.json();

	if (!userId || !date || !missions)
		return NextResponse.json({ error: 'Missing data' }, { status: 400 });

	const updated = await CoachMissionLog.findOneAndUpdate(
		{ userId, date },
		{ missions },
		{ upsert: true, new: true }
	);

	return NextResponse.json(updated);
}

export async function DELETE(req) {
	await connectDB();
	const userId = req.nextUrl.searchParams.get('userId');
	const date = req.nextUrl.searchParams.get('date');

	if (!userId || !date)
		return NextResponse.json(
			{ error: 'Missing userId or date' },
			{ status: 400 }
		);

	await CoachMissionLog.deleteOne({ userId, date });
	return NextResponse.json({ ok: true });
}
