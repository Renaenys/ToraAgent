import mongoose from 'mongoose';

const CoachSessionSchema = new mongoose.Schema({
	userId: { type: String, required: true },
	output: { type: String, required: true },
	missions: [String],
	createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.CoachSession ||
	mongoose.model('CoachSession', CoachSessionSchema);
