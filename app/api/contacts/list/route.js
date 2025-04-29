import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getContactsFromSheet } from "@/lib/sheetsUtils";

export async function POST(req) {
  try {
    const { email } = await req.json();
    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const contacts = await getContactsFromSheet(user.accessToken);

    return Response.json({ contacts });
  } catch (err) {
    console.error("❌ Failed to fetch contacts:", err.message);
    return Response.json(
      { error: "Failed to retrieve contacts" },
      { status: 500 }
    );
  }
}
