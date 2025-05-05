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

		const { ticker } = await req.json();
		if (!ticker) {
			return NextResponse.json({ error: 'Missing ticker' }, { status: 400 });
		}

		await dbConnect();

		const user = await User.findOne({ email: session.user.email });
		if (!user || user.membership !== 'VIP2') {
			return NextResponse.json({ error: 'VIP2 access only' }, { status: 403 });
		}

		const email = session.user.email;
		const today = new Date().toISOString().slice(0, 10);

		let usage = await ChartAiUsage.findOne({ email, date: today });
		if (!usage) {
			usage = await ChartAiUsage.create({ email, date: today, count: 0 });
		}

		if (usage.count >= 3) {
			return NextResponse.json(
				{ error: 'Daily usage limit reached', usageLeft: 0 },
				{ status: 403 }
			);
		}

		// generate image + analysis AFTER limit check
		const imageBuffer = await generateChartImage(ticker);
		const analysis = await analyzeChartImage(imageBuffer);
		const imageBase64 = imageBuffer.toString('base64');

		usage.count += 1;
		await usage.save();

		return NextResponse.json({
			image: imageBase64,
			analysis,
			usageLeft: 3 - usage.count,
		});
	} catch (err) {
		console.error('🔥 Error in /api/chart-ai:', err);
		return NextResponse.json(
			{ error: 'Server error', details: err.message },
			{ status: 500 }
		);
	}
}
