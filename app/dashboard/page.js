// ✅ app/dashboard/page.js
"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Welcome {session?.user?.name || "Guest"}
      </h1>
      <nav className="space-x-4">
        <Link href="/calendar" className="text-blue-600 hover:underline">
          Calendar
        </Link>
        <Link href="/chat" className="text-blue-600 hover:underline">
          AI Chat
        </Link>
        <Link href="/email" className="text-blue-600 hover:underline">
          Email
        </Link>
        <Link href="/contacts" className="text-blue-600 hover:underline">
          Contacts
        </Link>
      </nav>
    </main>
  );
}
