// ✅ app/register/page.js
"use client";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <button
        onClick={() => signIn("google")}
        className="bg-green-600 text-white px-6 py-3 rounded text-lg"
      >
        Register with Google
      </button>
    </main>
  );
}
