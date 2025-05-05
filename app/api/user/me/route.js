// ✅ /app/api/user/me/route.js
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function GET(req) {
	await dbConnect();
	const token = await getToken({ req });

	if (!token?.email) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const user = await User.findOne({ email: token.email });
	if (!user) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 });
	}

	return NextResponse.json({ user });
}
