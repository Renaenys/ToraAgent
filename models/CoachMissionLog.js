import mongoose from 'mongoose';

const CoachMissionLogSchema = new mongoose.Schema(
	{
		userId: { type: String, required: true },
		date: { type: String, required: true }, // Format: YYYY-MM-DD
		missions: [
			{
				text: String,
				completed: Boolean,
				timestamp: String, // e.g. "10:14 AM"
			},
		],
	},
	{ timestamps: true }
);

export default mongoose.models.CoachMissionLog ||
	mongoose.model('CoachMissionLog', CoachMissionLogSchema);
