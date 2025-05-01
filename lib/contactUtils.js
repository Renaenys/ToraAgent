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
	const exists = await Contact.findOne({ userId, email });
	if (exists) return { duplicate: true };

	const contact = new Contact({ userId, userEmail, name, email, phone });
	await contact.save();
	return { success: true };
}
