import { google } from 'googleapis';
import dbConnect from './dbConnect';
import User from '@/models/User';

// ✅ Get Google Auth client (shared for Gmail, Calendar, etc.)
export function getOAuthClient() {
	return new google.auth.OAuth2(
		process.env.GOOGLE_CLIENT_ID,
		process.env.GOOGLE_CLIENT_SECRET
		// process.env.GOOGLE_REDIRECT_URI // Optional but good to include
	);
}

// ✅ Get Google Calendar client with token refresh + DB update
export async function getGoogleClient(accessToken, refreshToken, userEmail) {
	const oAuth2Client = getOAuthClient();

	oAuth2Client.setCredentials({
		access_token: accessToken,
		refresh_token: refreshToken,
	});

	// 🔄 Auto-refresh token handler
	oAuth2Client.on('tokens', async (tokens) => {
		if (tokens.access_token && userEmail) {
			await dbConnect();
			await User.updateOne(
				{ email: userEmail },
				{ accessToken: tokens.access_token }
			);
			console.log('🔄 Access token refreshed for', userEmail);
		}
	});

	// ✅ Return a Calendar API client
	return google.calendar({ version: 'v3', auth: oAuth2Client });
}
