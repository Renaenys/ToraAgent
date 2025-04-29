import { getGoogleClient } from "@/lib/googleClient";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req) {
  const { email } = await req.json();
  await dbConnect();
  const user = await User.findOne({ email });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const calendar = getGoogleClient(user.accessToken);

  const now = new Date().toISOString(); // 🔥 current time in ISO

  const events = await calendar.events.list({
    calendarId: "primary",
    maxResults: 10,
    timeMin: now, // 🔥 Only events after now
    singleEvents: true, // 🔥 Expand recurring events
    orderBy: "startTime", // 🔥 Sort earliest to latest
  });

  return Response.json({ events: events.data.items });
}
