import mongoose from 'mongoose';

const MarketingGenUsageSchema = new mongoose.Schema(
	{
		email: { type: String, required: true },
		date: { type: String, required: true },
		count: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

export default mongoose.models.MarketingGenUsage ||
	mongoose.model('MarketingGenUsage', MarketingGenUsageSchema);
