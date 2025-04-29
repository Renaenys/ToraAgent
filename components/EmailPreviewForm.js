// ✅ components/EmailPreviewForm.js
"use client";
import { useState } from "react";

export default function EmailPreviewForm() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");

  const handleSend = async () => {
    setStatus("Sending...");
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, body }),
    });
    const data = await res.json();
    setStatus(data.error ? "Error sending email" : "Email sent!");
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Send Email</h2>
      <input
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="w-full border p-2 mb-2"
        placeholder="Recipient Email"
      />
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="w-full border p-2 mb-2"
        placeholder="Subject"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full border p-2 mb-2 h-32"
        placeholder="Email Body"
      />
      <button
        onClick={handleSend}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Send
      </button>
      <p className="text-sm mt-2">{status}</p>
    </div>
  );
}
