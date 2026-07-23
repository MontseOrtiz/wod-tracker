import type { Metadata } from 'next';
import Link from 'next/link';
import Form from 'next/form';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'History',
};

const PAGE_SIZE = 10;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function monthLabel(month: string): string {
  return MONTH_NAMES[Number(month) - 1] ?? month;
}

function buildHref(page: number, year: string | null, month: string | null): string {
  const params = new URLSearchParams();
  if (year) params.set('year', year);
  if (month) params.set('month', month);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return `/history${qs ? `?${qs}` : ''}`;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const requestedPage = Math.max(1, Number(params.page) || 1);
  const year = typeof params.year === 'string' && params.year !== '' ? params.year : null;
  const month = typeof params.month === 'string' && params.month !== '' ? params.month : null;
  const isFiltered = Boolean(year && month);

  // Fetch every session date once to populate the month/year dropdowns dynamically.
  const { data: allDatesRows } = await supabase.from('sessions').select('session_date');
  const allDates = allDatesRows?.map(row => row.session_date) ?? [];
  const availableYears = Array.from(new Set(allDates.map(d => d.split('-')[0]))).sort((a, b) =>
    b.localeCompare(a)
  );
  const availableMonths = Array.from(new Set(allDates.map(d => d.split('-')[1]))).sort((a, b) =>
    a.localeCompare(b)
  );

  function applyDateFilter<T extends { gte: (col: string, val: string) => T; lte: (col: string, val: string) => T }>(
    q: T
  ): T {
    if (!isFiltered || !year || !month) return q;
    const start = `${year}-${month}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    return q.gte('session_date', start).lte('session_date', end);
  }

  // Count first so we can clamp the requested page — Supabase errors on an
  // out-of-range .range() instead of just returning an empty page.
  const { count } = await applyDateFilter(
    supabase.from('sessions').select('id', { count: 'exact', head: true })
  );
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: sessions, error } = await applyDateFilter(
    supabase
      .from('sessions')
      .select('id, session_date, created_at')
      .order('session_date', { ascending: false })
      .order('created_at', { ascending: false })
  ).range(from, to);

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-semibold">Workout History</h1>
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">
          ← Home
        </Link>
      </div>

      <Form action="/history" className="flex flex-wrap items-end gap-3 mb-6">
        <input type="hidden" name="page" value="1" />
        <div className="flex flex-col gap-1">
          <label htmlFor="month" className="text-xs text-gray-400">Month</label>
          <select
            id="month"
            name="month"
            defaultValue={month ?? ''}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">All</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="year" className="text-xs text-gray-400">Year</label>
          <select
            id="year"
            name="year"
            defaultValue={year ?? ''}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">All</option>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          Filter
        </button>
        {(year || month) && (
          <Link href="/history" className="text-sm text-gray-500 hover:text-gray-800 underline">
            Clear filter
          </Link>
        )}
      </Form>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-6">
          {error.message}
        </p>
      )}

      {!error && sessions?.length === 0 && (
        <p className="text-sm text-gray-500">
          {isFiltered ? 'No workouts logged for that month.' : 'No workouts logged yet.'}
        </p>
      )}

      {sessions && sessions.length > 0 && (
        <div className="flex flex-col gap-2">
          {sessions.map(session => (
            <Link
              key={session.id}
              href={`/history/${session.id}`}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm font-medium">
                {formatDate(session.session_date)}
                <span className="text-gray-400 font-normal"> — {formatTime(session.created_at)}</span>
              </span>
              <span className="text-gray-400 text-sm">→</span>
            </Link>
          ))}
        </div>
      )}

      {sessions && sessions.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          {page > 1 ? (
            <Link
              href={buildHref(page - 1, year, month)}
              className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-gray-400">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={buildHref(page + 1, year, month)}
              className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </main>
  );
}
