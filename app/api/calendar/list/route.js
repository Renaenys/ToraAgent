// ✅ app/api/calendar/list/route.js
import { getGoogleClient } from "@/lib/googleClient";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req) {
  const { email } = await req.json();
  await dbConnect();

  const user = await User.findOne({ email });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const calendar = getGoogleClient(user.accessToken);
  const events = await calendar.events.list({
    calendarId: "primary",
    maxResults: 100,
    timeMin: new Date().toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return Response.json({ events: events.data.items });
}
