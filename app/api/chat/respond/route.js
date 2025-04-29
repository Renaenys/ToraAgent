import { getToken } from "next-auth/jwt";
import { chat } from "@/lib/langchain";
import dbConnect from "@/lib/dbConnect";
import ChatHistory from "@/models/ChatHistory";
import User from "@/models/User";
import { v4 as uuidv4 } from "uuid"; // ✅ Install UUID npm package

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req) {
  try {
    const token = await getToken({ req, secret });
    if (!token) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, sessionId: incomingSessionId } = await req.json(); // ✅ Also receive sessionId

    await dbConnect();
    const user = await User.findOne({ email: token.email });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    let sessionId = incomingSessionId;

    if (!sessionId) {
      sessionId = uuidv4(); // ✅ Generate new Session ID
    }

    let chatHistory = await ChatHistory.findOne({
      userId: user._id,
      sessionId,
    });

    if (!chatHistory) {
      chatHistory = await ChatHistory.create({
        userId: user._id,
        sessionId,
        messages: [],
      });
    }

    const limitedMessages = chatHistory.messages.slice(-5);
    limitedMessages.push({ role: "user", content: prompt });

    const systemPrompt = `
You are an assistant that ONLY outputs valid JSON when asked about creating calendar events.

Return ONLY:
{
  "title": "",
  "description": "",
  "start": "",
  "end": ""
}
Format start/end in ISO datetime.
Otherwise, answer normally.
    `;

    const fullPrompt = [
      { role: "system", content: systemPrompt },
      ...limitedMessages,
    ];

    console.log("🧠 Sending prompt to AI:", fullPrompt);

    const aiRes = await chat.call(fullPrompt);

    if (!aiRes || !aiRes.content) {
      throw new Error("Empty AI response");
    }

    // Update ChatHistory
    chatHistory.messages.push(
      { role: "user", content: prompt },
      { role: "assistant", content: aiRes.content }
    );
    await chatHistory.save();

    return Response.json({ reply: aiRes.content, sessionId }); // ✅ Always return current sessionId
  } catch (error) {
    console.error("❌ Error in /api/chat/respond:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
