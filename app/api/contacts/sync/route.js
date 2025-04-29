import { NextResponse } from "next/server";
import { getServerSession } from "next-auth"; // or wherever you get your session
import { authOptions } from "@/lib/auth"; // adjust path to your NextAuth config
import { addContactToSheet } from "@/lib/sheetsUtils";

export async function POST(request) {
  try {
    // 1️⃣ Read JSON body
    const { sessionId, userEmail, name, email, phone } = await request.json();

    // 2️⃣ Validate required fields
    if (!sessionId || !name || !email) {
      return NextResponse.json(
        { error: "Missing sessionId, name or email" },
        { status: 400 }
      );
    }

    // 3️⃣ (Optional) verify the user/session before writing
    const session = await getServerSession(authOptions);
    if (!session || session.user.email !== userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 4️⃣ Use your sheets util, passing a properly formed contact object
    await addContactToSheet(session.accessToken, { name, email });

    // 5️⃣ Respond success
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
