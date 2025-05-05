import dbConnect from '@/lib/dbConnect';
import ChatHistory from '@/models/ChatHistory';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getToken } from 'next-auth/jwt';
import Contact from '@/models/Contact';
import User from '@/models/User';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

function extractLastJsonObject(text) {
	const matches = text.match(/({[\s\S]*?})\s*$/);
	if (!matches) return null;
	try {
		return JSON.parse(matches[1]);
	} catch (e) {
		console.warn('⚠️ Failed to parse JSON block:', e);
		return null;
	}
}

async function resolveEmail(userId, name) {
	if (!name) return null;

	const contacts = await Contact.find({
		userId,
		name: { $regex: name, $options: 'i' },
	});

	if (contacts.length === 1) return contacts[0].email;

	const exact = contacts.find(
		(c) => c.name.toLowerCase() === name.toLowerCase()
	);
	if (exact) return exact.email;

	return null;
}

export async function POST(request) {
	try {
		await dbConnect();

		const { sessionId, prompt } = await request.json();
		if (!prompt) {
			return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
		}

		const token = await getToken({ req: request });
		if (!token || !token.sub) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}
		const userId = token.sub;

		let reply = '';
		let parsed = null;

		let chat = sessionId ? await ChatHistory.findOne({ sessionId }) : null;

		if (sessionId && !chat) {
			chat = new ChatHistory({ sessionId, userId, messages: [] });
		} else if (chat && !chat.userId) {
			chat.userId = userId;
		}

		if (chat) {
			chat.messages.push({ role: 'user', content: prompt });
		}

		const MCP_PROMPT = {
			role: 'system',
			content: `
You are a helpful assistant inside a productivity dashboard. Your job is to help users:

- ✅ Save contacts
- ✅ Schedule calendar events
- ✅ Compose emails
- ✅ Manage shopping lists

📌 If the user provides information, respond naturally like a human, then **append a raw JSON block** describing the action:

➡️ For Contact:
{
  "name": "Jane Doe",
  "email": "jane@example.com", // optional
  "phone": "012-3456789"       // optional
}

➡️ To lookup a contact's info:
{
  "type": "contact",
  "action": "lookup",
  "name": "Edwin"
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

➡️ For Shopping List:
{
  "type": "shopping",
  "items": [
    { "name": "Milk", "done": false }
  ]
}

➡️ To fetch shopping list:
{
  "type": "shopping",
  "action": "get-shopping"
}

❌ RULES:
- DO NOT wrap JSON in markdown, backticks, or use "Here's the JSON"
- DO NOT say platform instructions
- ✅ Just add raw JSON at the END

Today is ${new Date().toISOString().split('T')[0]}.
`.trim(),
		};

		let messages = [];

		if (chat?.messages?.length) {
			if (chat.messages.length > 20) {
				chat.messages = chat.messages.slice(-20);
			}
			messages = [MCP_PROMPT, ...chat.messages]; // Always prepend system prompt
		} else {
			messages = [MCP_PROMPT];
		}

		const completion = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages,
		});

		reply = completion.choices?.[0]?.message?.content;
		if (!reply) {
			reply = '❌ Sorry, I couldn’t understand that.';
			if (chat) {
				chat.messages.push({ role: 'assistant', content: reply });
				await chat.save();
			}
			return NextResponse.json({ reply });
		}

		parsed = extractLastJsonObject(reply);

		// 🛒 Handle get-shopping
		if (parsed?.type === 'shopping' && parsed?.action === 'get-shopping') {
			const user = await User.findOne({ email: token.email });
			if (!user?.email) {
				return NextResponse.json({
					reply: '❌ Cannot find your shopping list.',
				});
			}

			const listRes = await fetch(
				`${process.env.NEXTAUTH_URL}/api/shopping?email=${user.email}`
			);
			const listData = await listRes.json();
			const items = listData.items || [];

			if (items.length === 0) {
				reply = `Your shopping list is empty.`;
			} else {
				const lines = items.map((i) => `${i.item} ${i.done ? '✅' : '❌'}`);
				reply = [
					`Here's your shopping list:\n`,
					...lines,
					`\nLet me know if you need any changes or further assistance!`,
				].join('\n');
			}

			if (chat) {
				chat.messages.push({ role: 'assistant', content: reply });
				await chat.save();
			}

			return NextResponse.json({ reply });
		}

		// 📨 Handle contact name → email resolution for sending emails
		if (parsed?.to && !parsed.to.includes('@')) {
			const namePart = parsed.to.trim();
			const emailFromDB = await resolveEmail(userId, namePart);
			if (emailFromDB) {
				parsed.to = emailFromDB;
				reply = reply.replace(/({[\s\S]*?})\s*$/, '');
				reply = `${reply.trim()}\n\n${JSON.stringify(parsed)}`;
			}
		}

		// 📇 Handle contact lookup by name
		if (
			parsed?.type === 'contact' &&
			parsed?.action === 'lookup' &&
			parsed?.name
		) {
			const user = await User.findOne({ email: token.email });
			if (!user) {
				return NextResponse.json({
					reply: `❌ Cannot find your user account.`,
				});
			}

			await dbConnect();
			const match = await Contact.findOne({
				userId: token.sub,
				name: { $regex: parsed.name, $options: 'i' },
			});

			if (!match) {
				reply = `❌ No contact named "${parsed.name}" found.`;
			} else {
				const lines = [`📇 ${match.name}'s contact:`];
				if (match.email) lines.push(`📧 ${match.email}`);
				if (match.phone) lines.push(`📱 ${match.phone}`);
				reply = lines.join('\n');
			}

			if (parsed?.to && parsed?.subject && parsed?.body) {
				// You can optionally validate or log here if needed
				reply = `${reply.trim()}\n\n${JSON.stringify(parsed)}`;
			}

			if (chat) {
				chat.messages.push({ role: 'assistant', content: reply });
				await chat.save();
			}

			return NextResponse.json({ reply });
		}

		// 💬 Default reply save
		if (chat) {
			chat.messages.push({ role: 'assistant', content: reply });
			await chat.save();
		}

		return NextResponse.json({ reply });
	} catch (err) {
		console.error('❌ Chat API error:', err);
		return NextResponse.json(
			{ error: err.message || 'Server error' },
			{ status: 500 }
		);
	}
}
