import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
	const {
		userName,
		recipientName,
		recipientEmail,
		subject,
		originalMessage,
		userPrompt,
	} = await req.json();

	const prompt = `
You are an AI email assistant. Reply to the email professionally.

Sender: ${userName}
Recipient: ${recipientName} <${recipientEmail}>
Subject: ${subject}
Original message: "${originalMessage}"
User instruction: "${userPrompt}"

Reply in raw JSON format:
{
  "to": "${recipientEmail}",
  "subject": "${subject}",
  "body": "[your reply here]"
}
`.trim();

	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [{ role: 'user', content: prompt }],
		});

		const reply = completion.choices[0].message.content;
		return NextResponse.json({ reply });
	} catch (err) {
		console.error('Email AI reply failed:', err);
		return NextResponse.json(
			{ error: 'AI generation failed' },
			{ status: 500 }
		);
	}
}
