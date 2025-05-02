import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { getOAuthClient } from '@/lib/googleClient';

export async function POST(req) {
	try {
		const { email, id } = await req.json();

		if (!email || !id) {
			return NextResponse.json(
				{ error: 'Missing email or message ID' },
				{ status: 400 }
			);
		}

		console.log('[📩 Delete request]', { email, id });

		await dbConnect();
		const user = await User.findOne({ email });

		if (!user?.accessToken || !user?.refreshToken) {
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

		// ✅ Refresh the token safely
		let refreshed;
		try {
			refreshed = await auth.refreshAccessToken();
		} catch (err) {
			console.error('❌ Token refresh failed:', err);
			return NextResponse.json(
				{ error: 'Token refresh failed' },
				{ status: 500 }
			);
		}

		const { access_token, refresh_token } = refreshed.credentials;

		if (!access_token) {
			return NextResponse.json(
				{ error: 'Missing refreshed token' },
				{ status: 401 }
			);
		}

		// 🐛 Debug actual token and scopes
		console.log('[🐛 access_token]', access_token);

		try {
			const tokenInfo = await auth.getTokenInfo(access_token);
			console.log('[✅ TokenInfo]', tokenInfo);
			console.log('[🔍 Active token scopes]', tokenInfo?.scopes?.join(', '));
		} catch (err) {
			console.error('❌ Failed to inspect token:', err);
		}

		// ✅ Save to DB
		user.accessToken = access_token;
		if (refresh_token) user.refreshToken = refresh_token; // may be null
		await user.save();

		// ✅ Set fresh credentials
		auth.setCredentials({
			access_token,
			refresh_token: refresh_token || user.refreshToken,
		});

		// 🔐 Confirm who this token belongs to
		const gmail = google.gmail({ version: 'v1', auth });
		const profile = await gmail.users.getProfile({ userId: 'me' });
		console.log('[✅ Authenticated as]', profile.data.emailAddress);

		// 🔍 Confirm message exists before deleting
		const msg = await gmail.users.messages.get({ userId: 'me', id });
		console.log('[📨 Message found]', msg?.data?.id);

		// ✅ Proceed with delete
		await gmail.users.messages.delete({
			userId: 'me',
			id,
		});

		console.log('✅ Email deleted:', id);
		return NextResponse.json({ success: true });
	} catch (err) {
		console.error(
			'❌ Gmail delete failed:',
			err?.response?.data || err.message || err
		);
		return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
	}
}
