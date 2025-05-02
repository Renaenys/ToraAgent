import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ShoppingList from '@/models/ShoppingList';
import User from '@/models/User';

export async function GET(req) {
	const { searchParams } = new URL(req.url);
	const userEmail = searchParams.get('email');
	if (!userEmail) {
		return NextResponse.json({ error: 'Missing email' }, { status: 400 });
	}

	await dbConnect();
	const user = await User.findOne({ email: userEmail });
	if (!user) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 });
	}

	const items = await ShoppingList.find({ user: user._id }).sort({
		createdAt: -1,
	});
	return NextResponse.json({ items });
}

export async function POST(req) {
	try {
		const { email, items } = await req.json();
		if (!email || !Array.isArray(items)) {
			return NextResponse.json(
				{ error: 'Missing or invalid fields' },
				{ status: 400 }
			);
		}

		await dbConnect();
		const user = await User.findOne({ email });
		if (!user) {
			return NextResponse.json({ error: 'User not found' }, { status: 404 });
		}

		const newItems = await Promise.all(
			items.map(async (i) => {
				const name = i.name?.trim();
				if (!name) return null;

				const exists = await ShoppingList.findOne({
					user: user._id,
					item: name,
				});
				if (exists) return null;

				return await ShoppingList.create({
					user: user._id,
					userEmail: email,
					item: name,
					done: i.done || false,
				});
			})
		);

		const createdItems = newItems.filter(Boolean);
		return NextResponse.json({ items: createdItems });
	} catch (err) {
		console.error('❌ Shopping POST error:', err);
		return NextResponse.json(
			{ error: 'Failed to save shopping items' },
			{ status: 500 }
		);
	}
}
