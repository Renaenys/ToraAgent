// ✅ app/api/contacts/sync/route.js
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { addContactToSheet } from "@/lib/sheetsUtils";

export async function POST(req) {
  const { email, contact } = await req.json();

  await dbConnect();
  const user = await User.findOne({ email });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const result = await addContactToSheet(user.accessToken, contact);

  if (result.duplicate) {
    return Response.json({
      success: false,
      message: "Contact already exists.",
    });
  }

  return Response.json({ success: true });
}
