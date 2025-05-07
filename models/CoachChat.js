import mongoose from 'mongoose';

const CoachChatSchema = new mongoose.Schema({
	userId: { type: String, required: true, unique: true },
	messages: [
		{
			sender: { type: String, enum: ['user', 'coach'], required: true },
			content: { type: String, required: true },
			timestamp: { type: Date, default: Date.now },
		},
	],
});

export default mongoose.models.CoachChat ||
	mongoose.model('CoachChat', CoachChatSchema);
