// ✅ app/api/calendar/delete/route.js
import { getGoogleClient } from "@/lib/googleClient";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req) {
  const { email, eventId } = await req.json();
  await dbConnect();
  const user = await User.findOne({ email });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const calendar = getGoogleClient(user.accessToken);
  await calendar.events.delete({ calendarId: "primary", eventId });
  return Response.json({ success: true });
}
