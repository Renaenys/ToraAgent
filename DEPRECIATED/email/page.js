// ✅ app/email/page.js
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function EmailPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch("/api/email/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email }),
    })
      .then((res) => res.json())
      .then((data) => setMessages(data.messages || []));
  }, [session]);

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">Inbox</h1>
      <ul className="space-y-2">
        {messages.map((msg) => (
          <li key={msg.id} className="p-3 border rounded text-sm">
            Message ID: {msg.id}
          </li>
        ))}
      </ul>
    </main>
  );
}
