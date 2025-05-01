// /api/contacts/lookup/route.js

import dbConnect from '@/lib/dbConnect';
import Contact from '@/models/Contact';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function POST(request) {
	const token = await getToken({ req: request });
	if (!token)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { name } = await request.json();
	if (!name || name.length < 2)
		return NextResponse.json({ error: 'Name is required' }, { status: 400 });

	await dbConnect();

	// Fuzzy, case-insensitive match
	const contacts = await Contact.find({
		userId: token.sub,
		name: { $regex: name, $options: 'i' }, // matches partial names like "kel"
	});

	if (contacts.length === 0) {
		return NextResponse.json({ error: 'No contact found' }, { status: 404 });
	}

	return NextResponse.json({ contacts });
}
