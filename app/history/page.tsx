import type { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'History',
};

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function HistoryPage() {
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('id, session_date, created_at')
    .order('session_date', { ascending: false });

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold">Workout History</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">
          ← Home
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-6">
          {error.message}
        </p>
      )}

      {!error && sessions?.length === 0 && (
        <p className="text-sm text-gray-500">No workouts logged yet.</p>
      )}

      {sessions && sessions.length > 0 && (
        <div className="flex flex-col gap-2">
          {sessions.map(session => (
            <Link
              key={session.id}
              href={`/history/${session.id}`}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">{formatDate(session.session_date)}</span>
              <span className="text-gray-400 text-sm">→</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
