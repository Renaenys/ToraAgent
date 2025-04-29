import { getGoogleClient } from "@/lib/googleClient";
import { chat } from "@/lib/langchain";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(req) {
  const { email, prompt } = await req.json();

  await dbConnect();
  const user = await User.findOne({ email });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const calendar = getGoogleClient(user.accessToken);

  try {
    // 🗓️ Generate today's real date (YYYY-MM-DD)
    const today = new Date().toISOString().split("T")[0];

    const aiRes = await chat.call([
      {
        role: "user",
        content: `
Generate a valid JSON object for a Google Calendar event with the following fields only:
- title
- description
- start (ISO 8601 format, include timezone +08:00)
- end (ISO 8601 format, include timezone +08:00)

Here is the natural language prompt: "${prompt}"

**Important Rules:**
- If user does not mention a date, assume today's date is ${today}.
- If user mentions time (like 3PM), convert properly into ISO format with timezone +08:00.
- If user does not specify duration, default to 1 hour duration.
- RETURN ONLY pure JSON object without any markdown, no extra commentary, no code block.

Example:
{
  "title": "Team Meeting",
  "description": "Meeting with Alice",
  "start": "2025-04-30T15:00:00+08:00",
  "end": "2025-04-30T16:00:00+08:00"
}
        `,
      },
    ]);

    console.log("🧠 AI raw response:", aiRes.content);

    let event;
    try {
      event = JSON.parse(aiRes.content);
    } catch (err) {
      console.error("❌ Failed to parse AI JSON:", err.message);
      return Response.json(
        { error: "AI returned invalid JSON" },
        { status: 400 }
      );
    }

    if (!event.title || !event.start || !event.end) {
      return Response.json(
        { error: "AI response missing required fields" },
        { status: 400 }
      );
    }

    const created = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.title,
        description: event.description || "",
        start: {
          dateTime: event.start,
          timeZone: "Asia/Kuala_Lumpur",
        },
        end: {
          dateTime: event.end,
          timeZone: "Asia/Kuala_Lumpur",
        },
      },
    });

    console.log("📆 Event created:", created.data);

    return Response.json({
      eventId: created.data.id,
      eventLink: created.data.htmlLink,
    });
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    return Response.json(
      { error: "Something went wrong while creating the event" },
      { status: 500 }
    );
  }
}
