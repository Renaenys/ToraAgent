// ✅ app/api/chat/history/route.js
import dbConnect from "@/lib/dbConnect";
import ChatHistory from "@/models/ChatHistory";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
  const token = await getToken({ req });
  if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const logs = await ChatHistory.find({ userId: token.sub })
    .sort({ createdAt: -1 })
    .limit(10);
  return Response.json({ logs });
}
