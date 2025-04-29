// ✅ app/api/email/read/route.js
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getInboxEmails } from "@/lib/gmailUtils";

export async function POST(req) {
  const { email } = await req.json();
  await dbConnect();
  const user = await User.findOne({ email });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });
  const messages = await getInboxEmails(user.accessToken);
  return Response.json({ messages });
}
