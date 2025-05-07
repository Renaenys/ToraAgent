import mongoose from 'mongoose';

const CoachProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  identity: {
    fullName: String,
    email: String,
    country: String,
    timezone: String,
    ageRange: String,
    occupation: String,
    language: String,
    workingHours: Number,
    freeTime: String,
    energyPattern: String,
    motivationStyle: String,
  },
  goals: {
    sixMonthGoal: String,
    longTermDream: String,
    whyChange: String,
    blockers: [String],
    inspiration: String,
    desiredLife: String,
  },
  learning: {
    learningStyle: String,
    feedbackAcceptance: String,
    targetSkill: String,
    structurePreference: String,
    discomfortLevel: Number,
    builtHabitsBefore: String,
  },
  selfRatings: {
    consistency: Number,
    clarity: Number,
    focus: Number,
    timeManagement: Number,
    discipline: Number,
  },
  personalityQuiz: {
    overwhelmedResponse: String,
    freeHourResponse: String,
    failureResponse: String,
    followThrough: String,
    biggestBlocker: String,
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.CoachProfile || mongoose.model('CoachProfile', CoachProfileSchema);
