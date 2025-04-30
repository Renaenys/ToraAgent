  "use client";

  import { useEffect, useState } from "react";
  import Calendar from "react-calendar";
  import "react-calendar/dist/Calendar.css";
  import { useSession } from "next-auth/react";
  import "./calendarDark.css"; // (You already have this)

  export default function CalendarWidget() {
    const { data: session, status } = useSession();
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(true);

    const eventsByDate = events.reduce((map, event) => {
      const date = event.start.dateTime || event.start.date;
      const day = date.split("T")[0];
      map[day] = map[day] || [];
      map[day].push(event);
      return map;
    }, {});

    useEffect(() => {
      if (status === "authenticated") {
        fetch("/api/calendar/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session.user.email }),
        })
          .then((res) => res.json())
          .then((data) => {
            setEvents(data.events || []);
            setLoading(false);
          })
          .catch((err) => {
            console.error("❌ Calendar fetch error:", err);
            setLoading(false);
          });
      }
    }, [status]);

    const tileClassName = ({ date }) => {
      const key = date.toISOString().split("T")[0];
      return eventsByDate[key] ? "has-event" : "";
    };

    const displayDate = selectedDate.toISOString().split("T")[0];
    const dailyEvents = eventsByDate[displayDate] || [];

    const handleDeleteEvent = async (eventId) => {
      if (!confirm("Are you sure you want to delete this event?")) return;

      const res = await fetch("/api/calendar/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
          eventId,
        }),
      });

      if (res.ok) {
        setEvents(events.filter((e) => e.id !== eventId));
      } else {
        alert("❌ Failed to delete event.");
      }
    };

    return (
      <div className="text-white">
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileClassName={tileClassName}
          className="rounded-xl bg-[#1f2937] text-white shadow-lg p-2"
          calendarType="gregory"
          locale="en-US"
        />

        <div className="mt-4 bg-[#111827] p-4 rounded-xl shadow-md max-h-[300px] overflow-y-auto">
          <h3 className="text-lg font-bold mb-2">Events on {displayDate}</h3>
          {loading ? (
            <p className="text-gray-400">Loading events...</p>
          ) : dailyEvents.length === 0 ? (
            <p className="text-gray-500">No events.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {dailyEvents.map((event, idx) => (
                <li
                  key={idx}
                  className="p-2 bg-gray-800 rounded flex justify-between items-start"
                >
                  <div>
                    <p className="font-semibold">{event.summary}</p>
                    <p className="text-gray-400 text-xs">
                      {event.start.dateTime
                        ? new Date(event.start.dateTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "All day"}
                    </p>
                  </div>
                  <button
                    className="ml-2 text-red-400 hover:text-red-300 text-xs"
                    onClick={() => handleDeleteEvent(event.id)}
                    title="Delete event"
                  >
                    🗑
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
