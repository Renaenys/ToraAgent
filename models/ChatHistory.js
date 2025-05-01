// models/ChatHistory.js
import mongoose from 'mongoose';

const ChatHistorySchema = new mongoose.Schema({
	userId: { type: String, required: false },
	sessionId: { type: String, required: true, unique: true },
	messages: [
		{
			role: { type: String, enum: ['user', 'assistant'], required: true },
			content: { type: String, required: true },
			timestamp: { type: Date, default: Date.now },
		},
	],
	createdAt: { type: Date, default: Date.now },
});

// Avoid model recompilation issues in dev
const ChatHistory =
	mongoose.models.ChatHistory ||
	mongoose.model('ChatHistory', ChatHistorySchema);

export default ChatHistory;
