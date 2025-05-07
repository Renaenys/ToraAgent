import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import CoachMissionSequence from '@/models/CoachMissionSequence';
import { chat } from '@/lib/langchain';

export async function POST(req) {
	try {
		await connectDB();
		const { userId, coachData } = await req.json();

		if (!userId || !coachData) {
			return NextResponse.json(
				{ error: 'Missing userId or profile' },
				{ status: 400 }
			);
		}

		// Generate AI response
		const systemPrompt = `You are Tora Coach. Create a motivational 21-day challenge plan based on the user's growth profile. Return a list of tasks and reflections, clearly marked as bullet points or numbered items.`;
		const result = await chat.invoke([
			['system', systemPrompt],
			['user', `Here is my profile:\n${JSON.stringify(coachData, null, 2)}`],
		]);

		const content = result.content || '';
		const rawLines = content.split('\n');

		// Extract clean mission lines
		const lines = rawLines
			.map((line) => line.trim())
			.filter((line) => /^(\*|-|•|✳️|✅|\d+\.)\s+/.test(line)) // bullet or numbered
			.map((line) => line.replace(/^(\*|-|•|✳️|✅|\d+\.)\s+/, '').trim())
			.filter((line) => line.length > 0);

		if (lines.length === 0) {
			return NextResponse.json(
				{ error: 'No mission lines detected from AI output.' },
				{ status: 422 }
			);
		}

		// Split into 3-per-day mission list
		const missions = lines.slice(0, 63).map((text, i) => ({
			day: Math.floor(i / 3) + 1,
			text,
			completed: false,
			completedAt: '',
		}));

		await CoachMissionSequence.findOneAndUpdate(
			{ userId },
			{ userId, missions, createdAt: new Date() },
			{ upsert: true }
		);

		return NextResponse.json({ ok: true, output: result.content });
	} catch (err) {
		console.error('❌ Plan generation error:', err);
		return NextResponse.json(
			{ error: 'Failed to generate plan' },
			{ status: 500 }
		);
	}
}
