"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

export default function ChatBox() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [emailToSend, setEmailToSend] = useState(null);
  const [promptForName, setPromptForName] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    setLastUserMessage(input);

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setSending(true);

    const res = await fetch("/api/chat/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input }),
    });

    const data = await res.json();
    const reply = data.reply;

    const updatedMessages = [
      ...newMessages,
      { role: "assistant", content: reply },
    ];
    setMessages(updatedMessages);
    setSending(false);

    const emailMatch = reply.match(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    );
    if (emailMatch) {
      const email = emailMatch[1];
      setEmailToSend(email);
      setPromptForName(true);
    }
  };

  const handleSendEmail = async (name, email) => {
    if (!name || !email) return;

    const body = extractEmailBodyFromAI(messages);

    await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: session.user.email,
        recipient: email,
        name,
        subject: "Message from Chat",
        body,
      }),
    });

    await fetch("/api/contacts/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: session.user.email,
        contact: { name, email },
      }),
    });

    alert(`Email sent and contact ${name} saved.`);
    setEmailToSend(null);
    setPromptForName(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 text-white bg-[#1e1e2f] rounded-xl shadow-lg">
      <div className="h-[60vh] overflow-y-auto space-y-3 mb-4 border border-gray-700 p-4 rounded bg-[#2b2b3c]">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 max-w-[75%] rounded-xl whitespace-pre-wrap ${
              msg.role === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "mr-auto bg-gray-700 text-gray-100"
            }`}
          >
            <div>{msg.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {promptForName && emailToSend && (
        <div className="mb-4 p-4 bg-yellow-800/60 border border-yellow-400 rounded">
          <p className="mb-2 text-sm">
            You mentioned <strong>{emailToSend}</strong>. Would you like to send
            your message and save this contact?
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const name = e.target.name.value;
              handleSendEmail(name, emailToSend);
            }}
            className="flex gap-2"
          >
            <input
              name="name"
              placeholder="Recipient's Name"
              className="flex-1 px-4 py-2 border rounded bg-gray-800 text-white placeholder-gray-400"
              required
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-sm"
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
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border border-gray-600 rounded bg-gray-900 text-white placeholder-gray-500"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}

function extractEmailBodyFromAI(messages) {
  const reversed = [...messages].reverse();
  for (const msg of reversed) {
    if (msg.role === "assistant" && msg.content.includes("Subject:")) {
      return msg.content
        .replace(/(^.*Subject:)/s, "Subject:")
        .replace(/\*\*/g, "")
        .trim();
    }
  }
  return "No email body found.";
}
