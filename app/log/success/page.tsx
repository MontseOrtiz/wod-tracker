import Link from 'next/link';

export default function SuccessPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
      <h1 className="text-2xl font-semibold">Workout saved!</h1>
      <p className="text-gray-500">Nice work today.</p>
      <Link
        href="/log"
        className="mt-4 bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
      >
        Log another workout
      </Link>
      <Link
        href="/"
        className="mt-4 px-6 py-2 rounded-lg text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Home
      </Link>
    </main>
  );
}
