import dbConnect from "@/lib/dbConnect";
import ChatHistory from "@/models/ChatHistory";
import User from "@/models/User";
import { chat } from "@/lib/langchain";
import { getToken } from "next-auth/jwt";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

const secret = process.env.NEXTAUTH_SECRET;

export async function POST(req) {
  const token = await getToken({ req, secret });
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  const user = await User.findOne({ email: token.email });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const { prompt } = await req.json();

  const previous = await ChatHistory.findOne({ userId: user._id }).sort({
    createdAt: -1,
  });
  const messages = [];

  if (previous) {
    for (const msg of previous.messages.slice(-5)) {
      messages.push(
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      );
    }
  }

  messages.push(new HumanMessage(prompt)); // current user input

  const aiRes = await chat.call(messages); // returns LLMResult

  await ChatHistory.create({
    userId: user._id,
    messages: [
      ...(previous?.messages || []),
      { role: "user", content: prompt },
      { role: "assistant", content: aiRes.content },
    ],
  });

  return Response.json({ reply: aiRes.content });
}
