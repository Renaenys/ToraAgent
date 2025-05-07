import mongoose from 'mongoose';

const missionSchema = new mongoose.Schema({
	day: Number,
	text: String,
	completed: { type: Boolean, default: false },
	completedAt: { type: String, default: '' },
});

const CoachMissionSequenceSchema = new mongoose.Schema(
	{
		userId: { type: String, required: true, unique: true },
		missions: [missionSchema],
	},
	{ timestamps: true }
);

export default mongoose.models.CoachMissionSequence ||
	mongoose.model('CoachMissionSequence', CoachMissionSequenceSchema);
