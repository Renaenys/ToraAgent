// ✅ app/api/email/read/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { google } from 'googleapis';
import { getOAuthClient } from '@/lib/googleClient';

export async function POST(req) {
	try {
		const { email } = await req.json();
		if (!email) {
			return NextResponse.json({ error: 'Missing email' }, { status: 400 });
		}

		await dbConnect();
		const user = await User.findOne({ email });

		if (!user || !user.accessToken || !user.refreshToken) {
			return NextResponse.json(
				{ error: 'User not authorized' },
				{ status: 401 }
			);
		}

		const auth = getOAuthClient();
		auth.setCredentials({
			access_token: user.accessToken,
			refresh_token: user.refreshToken,
		});

		// 🔄 Auto refresh access token if expired
		const tokenInfo = await auth.getAccessToken();
		if (tokenInfo?.token && tokenInfo.token !== user.accessToken) {
			user.accessToken = tokenInfo.token;
			await user.save();
		}

		const gmail = google.gmail({ version: 'v1', auth });

		// ✅ Fetch latest 10 messages
		const listRes = await gmail.users.messages.list({
			userId: 'me',
			maxResults: 10,
		});

		const messageList = listRes.data.messages || [];

		// 🔍 Map summary info (for widget preview)
		const messageSummaries = await Promise.all(
			messageList.map(async (msg) => {
				const detail = await gmail.users.messages.get({
					userId: 'me',
					id: msg.id,
				});

				const payload = detail.data.payload || {};
				const headers = payload.headers || [];

				const getHeader = (name) =>
					headers.find((h) => h.name.toLowerCase() === name.toLowerCase())
						?.value;

				return {
					id: msg.id,
					snippet: detail.data.snippet,
					from: { email: getHeader('From') || '' },
					subject: getHeader('Subject') || '',
				};
			})
		);

		return NextResponse.json({ messages: messageSummaries });
	} catch (err) {
		console.error('❌ Gmail read failed:', err.message || err);
		return NextResponse.json({ error: 'Gmail fetch failed' }, { status: 500 });
	}
}
