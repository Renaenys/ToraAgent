"use client";

import CalendarWidget from "@/components/CalendarWidget";
import ChatBox from "@/components/ChatBox";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-4 flex flex-col lg:flex-row gap-4">
      {/* Left 2/3 - Calendar */}
      <div className="lg:w-2/3 w-full bg-[#161b22] rounded-xl p-4 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">📅 My Calendar</h2>
        <CalendarWidget />
      </div>

      {/* Right 1/3 - Assistant */}
      <div className="lg:w-1/3 w-full bg-[#161b22] rounded-xl p-4 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">🤖 Assistant</h2>
        <ChatBox />
      </div>
    </div>
  );
}
