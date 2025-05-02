import dbConnect from './dbConnect';
import Contact from '@/models/Contact';

export async function saveContactToMongo({
	userId,
	userEmail,
	name,
	email,
	phone,
}) {
	await dbConnect();

	const updated = await Contact.findOneAndUpdate(
		{ userId, name }, // match by name + user
		{
			userId,
			userEmail,
			name,
			email: email || '',
			phone: phone || '',
		},
		{ upsert: true, new: true }
	);

	return { contact: updated, duplicate: false };
}
