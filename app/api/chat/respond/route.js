// app/api/chat/respond/route.js
import dbConnect from "@/lib/dbConnect";
import ChatHistory from "@/models/ChatHistory";
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // 1️⃣ Connect to MongoDB
    await dbConnect();

    // 2️⃣ Parse & validate
    const { sessionId, prompt } = await request.json();
    if (!sessionId || !prompt) {
      return NextResponse.json(
        { error: "Missing sessionId or prompt" },
        { status: 400 }
      );
    }

    // 3️⃣ Load or create chat history
    let chat = await ChatHistory.findOne({ sessionId });
    if (!chat) {
      chat = new ChatHistory({ sessionId, messages: [] });
    }

    // 4️⃣ Append the user’s message
    chat.messages.push({ role: "user", content: prompt });

    // 5️⃣ Build history for OpenAI
    const history = chat.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 6️⃣ Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: history,
    });
    const reply = completion.choices?.[0]?.message?.content;
    if (!reply) throw new Error("No reply from OpenAI");

    // 7️⃣ Append assistant’s reply
    chat.messages.push({ role: "assistant", content: reply });

    // 8️⃣ Save updated history
    await chat.save();

    // 9️⃣ Return the reply
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Error in /api/chat/respond:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
