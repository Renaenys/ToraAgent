// ✅ app/calendar/page.js
"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import CalendarView from "@/DEPRECIATED/CalendarView";
import EventForm from "@/components/EventForm";

export default function CalendarPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);

  const loadEvents = async () => {
    const res = await fetch("/api/calendar/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email }),
    });
    const data = await res.json();
    setEvents(data.events || []);
  };

  useEffect(() => {
    if (session?.user?.email) loadEvents();
  }, [session]);

  const handleCreate = async (prompt) => {
    await fetch("/api/calendar/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email, prompt }),
    });
    loadEvents();
  };

  const handleDelete = async (eventId) => {
    await fetch("/api/calendar/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: session.user.email, eventId }),
    });
    loadEvents();
  };

  return (
    <div className="p-6">
      <EventForm onCreate={handleCreate} />
      <CalendarView events={events} onDelete={handleDelete} />
    </div>
  );
}
