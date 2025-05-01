import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { sendEmail } from '@/lib/sendEmail';

export async function POST(req) {
	const { userEmail, to, subject, body } = await req.json();

	if (!userEmail || !to || !subject || !body) {
		return Response.json({ error: 'Missing required fields' }, { status: 400 });
	}

	await dbConnect();
	const user = await User.findOne({ email: userEmail });
	if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

	try {
		await sendEmail({
			accessToken: user.accessToken,
			to,
			subject,
			body,
		});

		return Response.json({ success: true });
	} catch (err) {
		console.error('❌ Email error:', err.message);
		return Response.json(
			{ error: 'Email failed: ' + err.message },
			{ status: 500 }
		);
	}
}
