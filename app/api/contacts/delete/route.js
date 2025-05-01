import dbConnect from '@/lib/dbConnect';
import Contact from '@/models/Contact';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function POST(req) {
	const token = await getToken({ req });
	if (!token)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { contactId } = await req.json();
	await dbConnect();

	const deleted = await Contact.deleteOne({
		_id: contactId,
		userId: token.sub,
	});

	if (deleted.deletedCount === 0) {
		return NextResponse.json(
			{ error: 'Contact not found or unauthorized' },
			{ status: 404 }
		);
	}

	return NextResponse.json({ success: true });
}
