import dbConnect from '@/lib/dbConnect';
import Contact from '@/models/Contact';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function GET(request) {
	const token = await getToken({ req: request });
	if (!token)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	await dbConnect();
	const contacts = await Contact.find({ userId: token.sub }).sort({
		createdAt: -1,
	});
	return NextResponse.json({ contacts });
}
