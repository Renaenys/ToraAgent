import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(req) {
	try {
		const { email, to, subject, body } = await req.json();

		if (!email || !to || !subject || !body) {
			return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
		}

		await dbConnect();
		const user = await User.findOne({ email });

		if (!user?.accessToken || !user?.refreshToken) {
			return NextResponse.json(
				{ error: 'User not authorized' },
				{ status: 401 }
			);
		}

		const auth = new google.auth.OAuth2();
		auth.setCredentials({
			access_token: user.accessToken,
			refresh_token: user.refreshToken,
		});

		const gmail = google.gmail({ version: 'v1', auth });

		const message = [
			`To: ${to}`,
			`Subject: ${subject}`,
			'Content-Type: text/plain; charset=utf-8',
			'',
			body,
		].join('\n');

		const encodedMessage = Buffer.from(message)
			.toString('base64')
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');

		await gmail.users.messages.send({
			userId: 'me',
			requestBody: {
				raw: encodedMessage,
			},
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error('❌ Email send error:', err);
		return NextResponse.json(
			{ error: 'Failed to send email' },
			{ status: 500 }
		);
	}
}
