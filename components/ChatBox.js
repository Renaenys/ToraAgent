"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export default function ChatBox() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const [pendingContact, setPendingContact] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch AI response.");
      }

      const text = await res.text(); // ✅ fetch raw text first

      let replyContent = "";
      try {
        const json = JSON.parse(text);
        replyContent = json.reply || "🤖 (No reply)";
      } catch (err) {
        console.error(
          "❌ Failed to parse JSON, fallback to text:",
          err.message
        );
        replyContent = text || "🤖 (No reply)";
      }

      const updatedMessages = [
        ...newMessages,
        { role: "assistant", content: replyContent },
      ];
      setMessages(updatedMessages);
    } catch (err) {
      console.error("❌ AI Request failed:", err.message);
      alert("Something went wrong. Please try again.");
    }

    setSending(false);
  };

  const handleAIResponse = async (reply) => {
    const emailMatch = reply.match(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    );
    if (emailMatch) {
      const email = emailMatch[1];
      setPendingContact(email);
    }

    const jsonMatch = reply.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        const event = JSON.parse(jsonMatch[0]);
        if (event.title && event.start && event.end) {
          await fetch("/api/calendar/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: session.user.email,
              prompt: `Create event titled "${event.title}" starting at ${event.start} ending at ${event.end}`,
            }),
          });
          alert("✅ Calendar Event Created!");
        }
      } catch (err) {
        console.error("❌ Failed parsing event JSON:", err.message);
      }
    }
  };

  const handleSaveContactAndSendEmail = async (name) => {
    if (!pendingContact) return;
    try {
      // Send email
      await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          recipient: pendingContact,
          name,
          subject: "Message from Assistant",
          body: lastUserMessage(),
        }),
      });

      // Save contact
      await fetch("/api/contacts/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          contact: { name, email: pendingContact },
        }),
      });

      alert("✅ Email Sent and Contact Saved!");
    } catch (err) {
      console.error("❌ Failed to send email/save contact:", err);
    }
    setPendingContact(null);
  };

  const lastUserMessage = () => {
    const reversed = [...messages].reverse();
    for (const msg of reversed) {
      if (msg.role === "user") return msg.content;
    }
    return "";
  };

  const renderMessage = (msg, idx) => {
    const isCode = msg.content.includes("```");

    if (isCode) {
      const code = msg.content.replace(/```/g, "").trim();
      return (
        <pre
          key={idx}
          className="bg-gray-800 text-green-400 p-4 rounded-xl overflow-x-auto text-sm"
        >
          <code>{code}</code>
        </pre>
      );
    }

    return (
      <div
        key={idx}
        className={`p-3 max-w-[75%] rounded-xl ${
          msg.role === "user"
            ? "ml-auto bg-blue-600 text-white"
            : "mr-auto bg-gray-700 text-white"
        } whitespace-pre-wrap`}
      >
        {msg.content}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[80vh] bg-[#1f2937] p-4 rounded-xl shadow-lg">
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((msg, idx) => renderMessage(msg, idx))}
        <div ref={bottomRef} />
      </div>

      {pendingContact && (
        <div className="mt-4 bg-yellow-800 p-4 rounded-lg">
          <p className="text-sm mb-2">
            Found email <strong>{pendingContact}</strong>. Enter recipient name
            to send:
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = e.target.name.value;
              handleSaveContactAndSendEmail(name);
            }}
            className="flex gap-2"
          >
            <input
              name="name"
              placeholder="Recipient's Name"
              className="flex-1 px-4 py-2 rounded bg-gray-900 text-white"
              required
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
            >
              Send & Save
            </button>
          </form>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2 mt-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded bg-gray-800 text-white"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
