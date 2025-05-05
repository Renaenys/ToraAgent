import mongoose from 'mongoose';

const ChartAiUsageSchema = new mongoose.Schema(
	{
		email: { type: String, required: true },
		date: { type: String, required: true }, // e.g. "2025-05-05"
		count: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

ChartAiUsageSchema.index({ email: 1, date: 1 }, { unique: true });

export default mongoose.models.ChartAiUsage ||
	mongoose.model('ChartAiUsage', ChartAiUsageSchema);
