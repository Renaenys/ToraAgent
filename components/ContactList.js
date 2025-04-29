"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function ContactList() {
  const { data: session } = useSession();
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session?.user?.email) return;

    const fetchContacts = async () => {
      try {
        const res = await fetch("/api/contacts/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session.user.email }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({})); // Try parse error JSON
          throw new Error(errorData.error || "Failed to fetch contacts");
        }

        const data = await res.json();
        setContacts(data.contacts || []);
      } catch (err) {
        console.error("❌ Failed to load contacts:", err.message);
        setError(err.message);
      }
    };

    fetchContacts();
  }, [session]);

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Your Contacts</h2>
      {contacts.length === 0 ? (
        <p className="text-gray-500">No contacts found.</p>
      ) : (
        <ul className="space-y-2">
          {contacts.map(([name, email], idx) => (
            <li key={idx} className="p-3 border rounded shadow">
              <p className="font-medium">{name}</p>
              <p className="text-sm text-gray-600">{email}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
