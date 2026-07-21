import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-16 flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">WOD Tracker</h1>
        <p className="text-gray-500 text-sm">Log your CrossFit sessions, track your progress.</p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/log"
          className="flex items-center justify-center bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Start Today's Workout
        </Link>
        <Link
          href="/history"
          className="flex items-center justify-center border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          View History
        </Link>
      </div>
    </main>
  );
}
