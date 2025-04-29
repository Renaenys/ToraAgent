// ✅ lib/langchain.js
import { ChatOpenAI } from "@langchain/openai";

export const chat = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.5,
  openAIApiKey: process.env.OPENAI_API_KEY,
});
