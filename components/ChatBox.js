"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Modal from "./Modal";
import styles from "./ChatBox.module.css";

const STORAGE_KEY = "ToraSessionId";

export default function ChatBox() {
  const { data: session } = useSession();

  // sessionId starts as null (no client storage access during SSR)
  const [sessionId, setSessionId] = useState(null);

  // Only run in browser, never during SSR
  useEffect(() => {
    // Guard: window/localStorage only exist in browser
    if (typeof window !== "undefined") {
      let sid = localStorage.getItem(STORAGE_KEY);
      if (!sid) {
        sid = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, sid);
      }
      setSessionId(sid);
    }
  }, []);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [modalType, setModalType] = useState(null);
  const [formData, setFormData] = useState({});
  const bottomRef = useRef();

  // Scroll down when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a chat message—only when sessionId is ready
  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;
    setMessages((m) => [...m, { role: "user", text: input }]);
    const prompt = input;
    setInput("");
    const res = await fetch("/api/chat/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, prompt }),
    });
    const { reply } = await res.json();
    setMessages((m) => [...m, { role: "assistant", text: reply }]);
  };

  const openModal = (type) => {
    setFormData({});
    setModalType(type);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  // Submit Email / Contact / Event—again only when sessionId exists
  const handleSubmitModal = async () => {
    if (!sessionId) return;
    let url;
    if (modalType === "email") url = "/api/email/send";
    else if (modalType === "contact") url = "/api/contacts/sync";
    else if (modalType === "event") url = "/api/calendar/create";
    else return;

    const payload = {
      sessionId,
      userEmail: session?.user?.email,
      ...formData,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      alert("Error: " + (await res.text()));
    } else {
      alert(`${modalType.charAt(0).toUpperCase() + modalType.slice(1)} saved!`);
    }
    setModalType(null);
  };

  return (
    <div className={styles.chatContainer}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button onClick={() => openModal("email")}>✉️ Send Email</button>
        <button onClick={() => openModal("contact")}>👥 Save Contact</button>
        <button onClick={() => openModal("event")}>📅 Create Event</button>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? styles.userMsg : styles.assistantMsg}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={styles.inputRow}>
        <input
          type="text"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>

      {/* Modal */}
      {modalType && (
        <Modal onClose={() => setModalType(null)}>
          {modalType === "email" && (
            <>
              <h2>Send Email</h2>
              <input
                name="to"
                placeholder="Recipient Email"
                onChange={handleChange}
              />
              <input
                name="subject"
                placeholder="Subject"
                onChange={handleChange}
              />
              <textarea
                name="body"
                placeholder="Message"
                onChange={handleChange}
              />
            </>
          )}
          {modalType === "contact" && (
            <>
              <h2>Save Contact</h2>
              <input name="name" placeholder="Name" onChange={handleChange} />
              <input name="email" placeholder="Email" onChange={handleChange} />
              <input name="phone" placeholder="Phone" onChange={handleChange} />
            </>
          )}
          {modalType === "event" && (
            <>
              <h2>Create Event</h2>
              <input name="title" placeholder="Title" onChange={handleChange} />
              <input
                type="datetime-local"
                name="start"
                onChange={handleChange}
              />
              <input type="datetime-local" name="end" onChange={handleChange} />
              <textarea
                name="description"
                placeholder="Description"
                onChange={handleChange}
              />
            </>
          )}
          <button onClick={handleSubmitModal}>Submit</button>
        </Modal>
      )}
    </div>
  );
}
