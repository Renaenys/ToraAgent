// ✅ app/email/send/page.js
"use client";
import EmailPreviewForm from "@/components/EmailPreviewForm";

export default function SendEmailPage() {
  return (
    <main className="p-6">
      <EmailPreviewForm />
    </main>
  );
}
