// app/api/user/membership/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';

export async function POST(req) {
	try {
		await dbConnect(); // ✅ Make sure DB is connected

		const { email } = await req.json();

		if (!email) {
			return NextResponse.json({ error: 'Email is required' }, { status: 400 });
		}

		const user = await User.findOne({ email });

		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		// console.log('[User From DB]', user); // ✅ Confirm expireDate exists

		return NextResponse.json({
			membership: user.membership || 'None',
			expireDate: user.expireDate ? user.expireDate.toISOString() : null,
		});
	} catch (err) {
		console.error('❌ Membership route error:', err);
		return NextResponse.json({ error: 'Server error' }, { status: 500 });
	}
}
