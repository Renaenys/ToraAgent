// ✅ models/UserPreferences.js
import mongoose from "mongoose";

const UserPreferencesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    language: { type: String, default: "en" },
    timezone: { type: String, default: "Asia/Kuala_Lumpur" },
    calendarView: {
      type: String,
      enum: ["day", "week", "month"],
      default: "week",
    },
    emailSignature: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.UserPreferences ||
  mongoose.model("UserPreferences", UserPreferencesSchema);
