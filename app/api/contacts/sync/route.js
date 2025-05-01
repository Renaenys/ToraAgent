import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { saveContactToMongo } from '@/lib/contactUtils';

export async function POST(request) {
	const token = await getToken({ req: request });
	if (!token)
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { name, email, phone } = await request.json();
	if (!name || !email) {
		return NextResponse.json(
			{ error: 'Missing name or email' },
			{ status: 400 }
		);
	}

	const result = await saveContactToMongo({
		userId: token.sub,
		userEmail: token.email,
		name,
		email,
		phone,
	});

	if (result.duplicate) {
		return NextResponse.json({ warning: 'Contact already exists' });
	}

	return NextResponse.json({ success: true });
}
