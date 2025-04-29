import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { sendEmail } from "@/lib/sendEmail"; // assumed helper function

export async function POST(req) {
  const { email, recipient, name, subject, body } = await req.json();

  if (!recipient || !subject || !body) {
    return Response.json({ error: "Missing email fields" }, { status: 400 });
  }

  await dbConnect();
  const user = await User.findOne({ email });
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  try {
    await sendEmail({
      accessToken: user.accessToken,
      to: recipient, // ✅ make sure this is string like "test@example.com"
      subject,
      body,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("❌ Email error:", err.message);
    return Response.json(
      { error: "Email failed: " + err.message },
      { status: 500 }
    );
  }
}
