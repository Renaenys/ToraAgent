// ✅ app/api/calendar/create/route.js

import { getGoogleClient } from '@/lib/googleClient';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(req) {
	try {
		// 1️⃣ Parse request body
		const { sessionId, userEmail, title, description, start, end } =
			await req.json();

		if (!sessionId || !userEmail || !title || !start || !end) {
			return Response.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			);
		}

		// 2️⃣ Connect DB and get user
		await dbConnect();
		const user = await User.findOne({ email: userEmail });
		if (!user || !user.accessToken || !user.refreshToken) {
			return Response.json(
				{ error: 'User not found or not authorized' },
				{ status: 401 }
			);
		}

		// 3️⃣ Get Google Calendar client
		const calendar = await getGoogleClient(
			user.accessToken,
			user.refreshToken,
			user.email
		);

		if (!calendar?.events?.insert) {
			console.error('❌ Google Calendar client is invalid');
			return Response.json(
				{ error: 'Google client not properly initialized' },
				{ status: 500 }
			);
		}

		// 4️⃣ Create event
		const created = await calendar.events.insert({
			calendarId: 'primary',
			requestBody: {
				summary: title,
				description: description || '',
				start: {
					dateTime: start,
					timeZone: 'Asia/Kuala_Lumpur',
				},
				end: {
					dateTime: end,
					timeZone: 'Asia/Kuala_Lumpur',
				},
			},
		});

		console.log('📆 Event created:', created.data);

		// 5️⃣ Return success
		return Response.json({
			eventId: created.data.id,
			eventLink: created.data.htmlLink,
		});
	} catch (err) {
		console.error('❌ Error creating calendar event:', err);
		return Response.json(
			{ error: 'Something went wrong while creating the event' },
			{ status: 500 }
		);
	}
}
