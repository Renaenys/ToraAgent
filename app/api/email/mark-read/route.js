import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getOAuthClient } from '@/lib/googleClient';

export async function POST(req) {
	try {
		const { email, id } = await req.json();

		if (!email || !id) {
			return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
		}

		await dbConnect();
		const user = await User.findOne({ email });

		const auth = getOAuthClient();
		auth.setCredentials({
			access_token: user.accessToken,
			refresh_token: user.refreshToken,
		});

		const gmail = google.gmail({ version: 'v1', auth });

		await gmail.users.messages.modify({
			userId: 'me',
			id,
			requestBody: {
				removeLabelIds: ['UNREAD'],
			},
		});

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error('❌ Mark as read failed:', err);
		return NextResponse.json(
			{ error: 'Failed to mark as read' },
			{ status: 500 }
		);
	}
}
