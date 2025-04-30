"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Modal from "./Modal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyToClipboard } from "react-copy-to-clipboard";

const STORAGE_KEY = "ToraSessionId";

export default function ChatBox() {
  const { data: session } = useSession();
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [modalData, setModalData] = useState(null);
  const bottomRef = useRef();
  const [copiedIndex, setCopiedIndex] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let sid = localStorage.getItem(STORAGE_KEY);
      if (!sid) {
        sid = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, sid);
      }
      setSessionId(sid);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAIResponse = (reply) => {
    const t = reply.trim();
    if (t.startsWith("{") && t.endsWith("}")) {
      try {
        const parsed = JSON.parse(t);
        if (parsed.title && parsed.start && parsed.end) {
          return setModalData({ type: "event", data: parsed });
        }
        if (parsed.to && parsed.subject && parsed.body) {
          return setModalData({ type: "email", data: parsed });
        }
        if (parsed.name && parsed.email) {
          return setModalData({ type: "contact", data: parsed });
        }
      } catch {}
    }
    setMessages((m) => [...m, { role: "assistant", text: reply }]);
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;
    setMessages((m) => [...m, { role: "user", text: input }]);
    const prompt = input;
    setInput("");
    try {
      const res = await fetch("/api/chat/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, prompt }),
      });
      const { reply } = await res.json();
      handleAIResponse(reply || "");
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Error processing request." },
      ]);
    }
  };

  const handleChange = (e) => setInput(e.target.value);

  const handleModalSubmit = async () => {
    if (!sessionId || !modalData) return;
    const urlMap = {
      event: "/api/calendar/create",
      email: "/api/email/send",
      contact: "/api/contacts/sync",
    };
    const url = urlMap[modalData.type];
    const payload = {
      sessionId,
      userEmail: session?.user?.email,
      ...modalData.data,
    };
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `${modalData.type} confirmed.` },
      ]);
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "assistant", text: "Action failed." }]);
    } finally {
      setModalData(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-2 flex flex-col">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[75%] p-2 rounded-lg whitespace-pre-wrap break-words ${
              m.role === "user"
                ? "self-end bg-blue-600 text-white"
                : "self-start bg-gray-700 text-gray-200"
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  return !inline ? (
                    <div className="relative">
                      <pre className="bg-gray-800 p-2 rounded-lg overflow-x-auto">
                        <code {...props}>{children}</code>
                      </pre>
                      <CopyToClipboard
                        text={String(children)}
                        onCopy={() => setCopiedIndex(i)}
                      >
                        <button className="absolute top-2 right-2 text-sm px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded">
                          {copiedIndex === i ? "Copied" : "Copy"}
                        </button>
                      </CopyToClipboard>
                    </div>
                  ) : (
                    <code {...props} className="bg-gray-700 px-1 rounded">
                      {children}
                    </code>
                  );
                },
                p({ node, children, ...props }) {
                  return (
                    <div {...props} className="mb-2">
                      {children}
                    </div>
                  );
                },
              }}
            >
              {m.text}
            </ReactMarkdown>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex p-2 bg-gray-800">
        <input
          className="flex-1 p-2 rounded-l-lg bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none"
          type="text"
          placeholder="Type a message…"
          value={input}
          onChange={handleChange}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className="px-4 bg-green-500 hover:bg-green-600 rounded-r-lg"
          onClick={handleSend}
        >
          Send
        </button>
      </div>

      {modalData && (
        <Modal onClose={() => setModalData(null)}>
          <div className="space-y-2">
            {modalData.type === "event" && (
              <>
                <h2 className="text-xl font-semibold">Confirm Event</h2>
                <p>Title: {modalData.data.title}</p>
                <p>Start: {modalData.data.start}</p>
                <p>End: {modalData.data.end}</p>
                <p>Description: {modalData.data.description}</p>
              </>
            )}
            {modalData.type === "email" && (
              <>
                <h2 className="text-xl font-semibold">Confirm Email</h2>
                <p>To: {modalData.data.to}</p>
                <p>Subject: {modalData.data.subject}</p>
                <p>Body: {modalData.data.body}</p>
              </>
            )}
            {modalData.type === "contact" && (
              <>
                <h2 className="text-xl font-semibold">Confirm Contact</h2>
                <p>Name: {modalData.data.name}</p>
                <p>Email: {modalData.data.email}</p>
                <p>Phone: {modalData.data.phone || "N/A"}</p>
              </>
            )}
          </div>
          <button
            className="mt-4 w-full p-2 bg-green-500 hover:bg-green-600 rounded"
            onClick={handleModalSubmit}
          >
            OK
          </button>
        </Modal>
      )}
    </div>
  );
}
