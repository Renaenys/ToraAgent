// ✅ components/CalendarView.js
"use client";
import { useEffect, useState } from "react";

export default function CalendarView({ events, onDelete }) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Your Calendar Events</h2>
      <ul className="space-y-2">
        {events.map((event) => (
          <li
            key={event.id}
            className="p-3 border rounded shadow flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{event.summary}</p>
              <p className="text-sm text-gray-600">{event.start?.dateTime}</p>
            </div>
            <button
              onClick={() => onDelete(event.id)}
              className="text-red-500 hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
