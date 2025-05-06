import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import MarketingGenUsage from '@/models/MarketingGenUsage';
import { NextResponse } from 'next/server';

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		await dbConnect();
		const today = new Date().toISOString().slice(0, 10);

		const usage = await MarketingGenUsage.findOne({
			email: session.user.email,
			date: today,
		});

		const used = usage?.count || 0;
		return NextResponse.json({ usageLeft: Math.max(0, 3 - used) });
	} catch (err) {
		console.error('❌ Error getting usage:', err);
		return NextResponse.json({ error: 'Server error' }, { status: 500 });
	}
}
