import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import MarketingGenUsage from '@/models/MarketingGenUsage';
import { generateMarketingText, extractPromptFromImage } from '@/lib/gpt4oMini';
import { generateImageFromText } from '@/lib/gptImageGen';

export async function POST(req) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const formData = await req.formData();
		const prompt = formData.get('prompt');
		const file = formData.get('image');

		if (!prompt || typeof prompt !== 'string') {
			return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
		}

		await dbConnect();

		const email = session.user.email;
		const today = new Date().toISOString().slice(0, 10);

		// Check or create usage
		let usage = await MarketingGenUsage.findOne({ email, date: today });
		if (!usage) {
			usage = await MarketingGenUsage.create({ email, date: today, count: 0 });
		}
		if (usage.count >= 3) {
			return NextResponse.json(
				{ error: 'Daily usage limit reached', usageLeft: 0 },
				{ status: 403 }
			);
		}

		// 🧠 Generate marketing copy
		const text = await generateMarketingText(prompt);

		// 🖼 Generate image
		let imageUrl = null;
		if (file && typeof file.arrayBuffer === 'function') {
			const buffer = Buffer.from(await file.arrayBuffer());

			// Describe uploaded image using GPT-4 Vision
			const visionPrompt = await extractPromptFromImage(buffer);

			// Merge both prompts into a new image prompt
			const finalPrompt = `${visionPrompt}. Context: ${prompt}`;
			imageUrl = await generateImageFromText(finalPrompt);
		} else {
			// No image uploaded – generate purely from prompt
			imageUrl = await generateImageFromText(prompt);
		}

		// Update usage
		usage.count += 1;
		await usage.save();

		return NextResponse.json({
			text,
			image: imageUrl,
			usageLeft: 3 - usage.count,
		});
	} catch (err) {
		console.error('🔥 Error in /api/marketing-gen:', err);
		return NextResponse.json(
			{ error: 'Server error', details: err.message },
			{ status: 500 }
		);
	}
}
