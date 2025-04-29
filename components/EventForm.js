// ✅ components/EventForm.js
"use client";
import { useState } from "react";

export default function EventForm({ onCreate }) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    onCreate(prompt);
    setPrompt("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <label className="block text-sm font-medium">Describe the event</label>
      <input
        className="border p-2 w-full mt-1 mb-3"
        placeholder="e.g., Meeting with John at 3PM tomorrow"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create via AI
      </button>
    </form>
  );
}
    