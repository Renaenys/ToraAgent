import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import ShoppingList from '@/models/ShoppingList';
import { getGoogleClient } from '@/lib/googleClient';
import { chat } from '@/lib/langchain';
import Briefing from '@/models/Briefing'; // ✅ add this

export async function POST(req) {
	try {
		const { email } = await req.json();
		if (!email) {
			return NextResponse.json({ error: 'Missing email' }, { status: 400 });
		}

		await dbConnect();
		const user = await User.findOne({ email });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// 🗓️ Get Google Calendar events
		let events = [];
		if (user.accessToken && user.refreshToken) {
			const calendar = await getGoogleClient(
				user.accessToken,
				user.refreshToken,
				email
			);
			if (calendar?.events?.list) {
				const now = new Date().toISOString();
				const res = await calendar.events.list({
					calendarId: 'primary',
					timeMin: now,
					maxResults: 10,
					singleEvents: true,
					orderBy: 'startTime',
				});
				events = res.data.items || [];
			}
		}

		// 🛒 Get Shopping List
		const shoppingItems = await ShoppingList.find({ user: user._id }).sort({
			createdAt: -1,
		});

		// 📄 AI Prompt
		const prompt = `
Good morning. Summarize the following:

📅 Calendar Events:
${
	events.length > 0
		? events
				.map((e) => `- ${e.summary} at ${e.start?.dateTime || e.start?.date}`)
				.join('\n')
		: 'No events today.'
}

🛒 Shopping List:
${
	shoppingItems.length > 0
		? shoppingItems
				.map((i) => `- ${i.item} [${i.done ? 'Done' : 'Pending'}]`)
				.join('\n')
		: 'No items in the list.'
}

Reply with a friendly and short summary of what's ahead today in bullet points. Include key names and times clearly.
		`;

		console.log('🧠 AI Briefing Prompt:\n', prompt);

		const aiResult = await chat.call([{ role: 'user', content: prompt }]);
		const today = new Date().toISOString().split('T')[0];

		// ✅ Save or update in database
		await Briefing.findOneAndUpdate(
			{ email, date: today },
			{ summary: aiResult.content },
			{ upsert: true, new: true }
		);

		return NextResponse.json({ summary: aiResult.content });
	} catch (err) {
		console.error('❌ Briefing update error:', err);
		return NextResponse.json({ error: 'Briefing failed.' }, { status: 500 });
	}
}
