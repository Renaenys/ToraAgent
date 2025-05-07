import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MarketingGenUsage from '@/models/MarketingGenUsage';

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await dbConnect();
		const email = session.user.email;
		const today = new Date().toISOString().slice(0, 10);

		let usage = await MarketingGenUsage.findOne({ email, date: today });
		const usageLeft = usage ? Math.max(0, 3 - usage.count) : 3;

		return NextResponse.json({ usageLeft });
	} catch (err) {
		console.error('🔥 GET usage error:', err);
		return NextResponse.json({ error: 'Server error' }, { status: 500 });
	}
}
