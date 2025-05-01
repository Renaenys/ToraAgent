// ✅ app/contacts/page.js
"use client";
import ContactList from "@/components/ContactWidget";

export default function ContactsPage() {
  return (
    <main className="p-6">
      <ContactList />
    </main>
  );
}
