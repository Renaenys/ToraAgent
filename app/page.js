// ✅ app/page.js
export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100">
      <a
        href="/dashboard"
        className="text-xl font-semibold bg-blue-600 text-white px-6 py-3 rounded"
      >
        Go to Dashboard
      </a>
    </main>
  );
}
