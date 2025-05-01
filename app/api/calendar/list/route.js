import { getGoogleClient } from '@/lib/googleClient';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(req) {
	try {
		const { email } = await req.json();

		if (!email) {
			return Response.json({ error: 'Missing email' }, { status: 400 });
		}

		// 1️⃣ DB connect & fetch user
		await dbConnect();
		const user = await User.findOne({ email });

		if (!user || !user.accessToken || !user.refreshToken) {
			return Response.json({ error: 'User not authorized' }, { status: 401 });
		}

		// 2️⃣ Get Google Calendar client
		const calendar = await getGoogleClient(
			user.accessToken,
			user.refreshToken,
			user.email
		);

		if (!calendar?.events?.list) {
			console.error('❌ Invalid Google Calendar client');
			return Response.json(
				{ error: 'Calendar API not available' },
				{ status: 500 }
			);
		}

		// 3️⃣ Get upcoming events
		const now = new Date().toISOString();

		const list = await calendar.events.list({
			calendarId: 'primary',
			timeMin: now,
			maxResults: 50,
			singleEvents: true,
			orderBy: 'startTime',
		});

		const events = list.data.items || [];

		return Response.json({ events });
	} catch (err) {
		console.error('❌ Calendar list error:', err);
		return Response.json(
			{ error: 'Something went wrong while fetching events' },
			{ status: 500 }
		);
	}
}
