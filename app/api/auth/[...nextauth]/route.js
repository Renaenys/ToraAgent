import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export const authOptions = {
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			authorization: {
				params: {
					scope: [
						'openid',
						'email',
						'profile',
						'https://www.googleapis.com/auth/calendar',
						'https://www.googleapis.com/auth/gmail.readonly',
						'https://www.googleapis.com/auth/gmail.send',
						'https://www.googleapis.com/auth/gmail.modify',
						'https://www.googleapis.com/auth/gmail.labels',
						'https://www.googleapis.com/auth/spreadsheets',
					].join(' '),
					access_type: 'offline',
					prompt: 'consent',
					include_granted_scopes: true,
				},
			},
		}),
	],
	callbacks: {
		async signIn({ user, account }) {
			await dbConnect();
			await User.findOneAndUpdate(
				{ email: user.email },
				{
					name: user.name,
					email: user.email,
					accessToken: account.access_token,
					refreshToken: account.refresh_token,
					image: user.image,
				},
				{ upsert: true }
			);
			return true;
		},
		async session({ session }) {
			return session;
		},
	},
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
