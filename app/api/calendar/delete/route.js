import { getGoogleClient } from '@/lib/googleClient';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(req) {
	const { email, eventId } = await req.json();

	await dbConnect();
	const user = await User.findOne({ email });
	if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

	const calendar = await getGoogleClient(
		user.accessToken,
		user.refreshToken,
		user.email
	);

	if (!calendar?.events?.delete) {
		console.error('❌ Google Calendar client not ready:', calendar);
		return Response.json(
			{ error: 'Calendar API unavailable' },
			{ status: 500 }
		);
	}

	try {
		await calendar.events.delete({
			calendarId: 'primary',
			eventId,
		});
		return Response.json({ success: true });
	} catch (err) {
		console.error('❌ Failed to delete event:', err);
		return Response.json({ error: 'Delete failed' }, { status: 500 });
	}
}
