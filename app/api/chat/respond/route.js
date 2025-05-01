// ✅ app/api/chat/respond/route.js

import dbConnect from '@/lib/dbConnect';
import ChatHistory from '@/models/ChatHistory';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getToken } from 'next-auth/jwt';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
	try {
		await dbConnect();

		// ✅ 1. Parse request body
		const { sessionId, prompt } = await request.json();
		if (!sessionId || !prompt) {
			return NextResponse.json(
				{ error: 'Missing sessionId or prompt' },
				{ status: 400 }
			);
		}

		// ✅ 2. Validate user session
		const token = await getToken({ req: request });
		if (!token || !token.sub) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		const userId = token.sub;

		// ✅ 3. Load or initialize chat history
		let chat = await ChatHistory.findOne({ sessionId });
		if (!chat) {
			chat = new ChatHistory({ sessionId, userId, messages: [] });
		} else if (!chat.userId) {
			chat.userId = userId; // backfill
		}

		chat.messages.push({ role: 'user', content: prompt });

		// ✅ 4. System prompt for AI (MCP)
		const MCP_PROMPT = {
			role: 'system',
			content: `
You are a helpful assistant inside a productivity dashboard. Your job is to help users do things like:

- ✅ Save contacts
- ✅ Schedule calendar events
- ✅ Compose emails

📌 If the user provides information, respond naturally like a human, then **append a raw JSON block** describing the action:

➡️ For Contact:
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "optional"
}

➡️ For Calendar Event:
{
  "title": "Lunch with Bob",
  "start": "2025-05-01T13:00:00+08:00",
  "end": "2025-05-01T14:00:00+08:00"
}

➡️ For Email:
{
  "to": "kelvin@example.com",
  "subject": "Meeting Notes",
  "body": "Here are the notes from our meeting..."
}

❌ RULES:
- DO NOT wrap JSON in markdown, backticks, or "Here's the JSON"
- DO NOT give platform instructions like “open the calendar app”
- ✅ Just add the raw JSON at the END of your reply

Today is ${new Date().toISOString().split('T')[0]}.
`.trim(),
		};

		// ✅ 5. Call OpenAI
		const messages = [MCP_PROMPT, ...chat.messages];
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages,
		});

		const reply = completion.choices?.[0]?.message?.content;
		if (!reply) throw new Error('No reply from OpenAI');

		// ✅ 6. Save assistant message
		chat.messages.push({ role: 'assistant', content: reply });
		await chat.save();

		// ✅ 7. Return reply
		return NextResponse.json({ reply });
	} catch (err) {
		console.error('❌ Chat API error:', err);
		return NextResponse.json(
			{ error: err.message || 'Server error' },
			{ status: 500 }
		);
	}
}
