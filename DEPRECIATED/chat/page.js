// ✅ app/chat/page.js
"use client";
import ChatBox from "@/components/ChatBox";

export default function ChatPage() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">Chat with Tora (AI Assistant)</h1>
      <ChatBox />
    </main>
  );
}
