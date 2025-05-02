import dbConnect from '@/lib/dbConnect';
import Contact from '@/models/Contact';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function POST(request) {
	const token = await getToken({ req: request });
	if (!token) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { name } = await request.json();
	if (!name || name.length < 2) {
		return NextResponse.json({ error: 'Name is required' }, { status: 400 });
	}

	await dbConnect();

	const contacts = await Contact.find({
		userId: token.sub,
		name: { $regex: name, $options: 'i' },
	});

	const filtered = contacts.filter((c) => c.email && c.email.includes('@'));

	if (filtered.length === 0) {
		return NextResponse.json(
			{ error: 'No contact with email found' },
			{ status: 404 }
		);
	}

	return NextResponse.json({ contacts: filtered });
}
