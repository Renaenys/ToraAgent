import mongoose from "mongoose";

const ChatHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    sessionId: { type: String, required: true }, // ✅ NEW: Session ID
    messages: [
      {
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.ChatHistory ||
  mongoose.model("ChatHistory", ChatHistorySchema);
