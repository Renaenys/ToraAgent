// models/Contact.js
import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema(
	{
		userId: { type: String, required: true }, // from session.sub
		userEmail: { type: String, required: true }, // for reference
		name: { type: String, required: true },
		email: { type: String, required: true },
		phone: { type: String },
	},
	{ timestamps: true }
);

export default mongoose.models.Contact ||
	mongoose.model('Contact', ContactSchema);
