import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import ChartAiUsage from '@/models/ChartAiUsage';
import { generateChartImage } from '@/lib/chartImg';
import { analyzeChartImage } from '@/lib/langchainVision';

export async function POST(req) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		let { ticker } = await req.json();
		if (!ticker || !ticker.includes(':')) {
			return NextResponse.json(
				{ error: 'Invalid ticker format' },
				{ status: 400 }
			);
		}

		// Validate exchange and pair
		const [exchange, pair] = ticker.trim().toUpperCase().split(':');
		const allowedExchanges = ['BINANCE', 'NASDAQ', 'OANDA'];
		if (!allowedExchanges.includes(exchange) || !pair) {
			return NextResponse.json(
				{ error: 'Invalid exchange or symbol' },
				{ status: 400 }
			);
		}

		await dbConnect();

		const user = await User.findOne({ email: session.user.email });
		if (!user || user.membership !== 'VIP2') {
			return NextResponse.json({ error: 'VIP2 access only' }, { status: 403 });
		}

		const email = session.user.email;
		const today = new Date().toISOString().slice(0, 10);

		// Check usage count
		const usage = await ChartAiUsage.findOne({ email, date: today });
		const used = usage?.count || 0;

		if (used >= 3) {
			return NextResponse.json(
				{ error: 'Daily usage limit reached', usageLeft: 0 },
				{ status: 403 }
			);
		}

		// 🧠 Generate image and analyze
		const imageBuffer = await generateChartImage(`${exchange}:${pair}`);
		const analysis = await analyzeChartImage(imageBuffer);
		const imageBase64 = imageBuffer.toString('base64');

		// ✅ Update or insert usage count
		await ChartAiUsage.updateOne(
			{ email, date: today },
			{ $inc: { count: 1 } },
			{ upsert: true }
		);

		return NextResponse.json({
			image: imageBase64,
			analysis,
			usageLeft: 2 - used, // used already counted before increment
		});
	} catch (err) {
		console.error('🔥 Error in /api/chart-ai:', err);
		return NextResponse.json(
			{ error: 'Server error', details: err.message },
			{ status: 500 }
		);
	}
}
