import mongoose from 'mongoose';

const BriefingSchema = new mongoose.Schema(
	{
		email: { type: String, required: true },
		date: { type: String, required: true }, // Format: YYYY-MM-DD
		summary: { type: String, required: true },
	},
	{ timestamps: true }
);

export default mongoose.models.Briefing ||
	mongoose.model('Briefing', BriefingSchema);
