// ✅ app/api/shopping/[id]/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ShoppingList from '@/models/ShoppingList';

export async function PUT(request, { params }) {
	const { id } = params ?? {};
	const { done } = await request.json();

	await dbConnect();
	const updated = await ShoppingList.findByIdAndUpdate(
		id,
		{ done },
		{ new: true }
	);

	return NextResponse.json({ item: updated });
}

export async function DELETE(request, { params }) {
	const { id } = params ?? {};

	if (!id) {
		return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
	}

	await dbConnect();
	const deleted = await ShoppingList.findByIdAndDelete(id);

	return NextResponse.json({ item: deleted });
}
