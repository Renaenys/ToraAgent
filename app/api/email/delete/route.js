// ✅ app/api/email/delete/route.js
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

		// ✅ Try refreshing token manually
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

		// ✅ Save updated tokens
		user.accessToken = access_token;
		if (refresh_token) user.refreshToken = refresh_token;
		await user.save();

		// ✅ Set fresh credentials again
		auth.setCredentials({
			access_token,
			refresh_token: refresh_token || user.refreshToken,
		});

		// 🔍 Confirm token scopes for debugging
		try {
			const tokenInfo = await auth.getTokenInfo(access_token);
			console.log('[✅ TokenInfo]', tokenInfo);
			console.log('[🔍 Active token scopes]', tokenInfo?.scopes?.join(', '));
		} catch (err) {
			console.error('❌ Failed to inspect token:', err);
		}

		// ✅ Proceed with deletion using updated auth
		const gmail = google.gmail({ version: 'v1', auth });
		const profile = await gmail.users.getProfile({ userId: 'me' });
		console.log('[✅ Authenticated as]', profile.data.emailAddress);

		const msg = await gmail.users.messages.get({ userId: 'me', id });
		console.log('[📨 Message found]', msg?.data?.id);

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
