import type { Metadata } from 'next';
import Link from 'next/link';
import Form from 'next/form';
import { supabase } from '@/lib/supabase';
import { GeometricPattern } from '@/components/ui/GeometricPattern';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Historial',
};

const PAGE_SIZE = 10;

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function dateParts(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return {
    day,
    month: date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''),
    weekday: date.toLocaleDateString('es-ES', { weekday: 'long' }),
  };
}

function formatTime(createdAt: string | null): string | null {
  if (!createdAt) return null;
  return new Date(createdAt).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
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
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Tus rounds</h1>
        <p className="text-base text-ink/80">Del más reciente al más viejo.</p>
      </div>

      <Form action="/history" className="card flex flex-wrap items-end gap-3">
        <input type="hidden" name="page" value="1" />
        <div className="flex min-w-32 flex-1 flex-col gap-1.5">
          <label htmlFor="month" className="field-label">Mes</label>
          <select id="month" name="month" defaultValue={month ?? ''} className="field">
            <option value="">Todos</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        </div>
        <div className="flex min-w-28 flex-1 flex-col gap-1.5">
          <label htmlFor="year" className="field-label">Año</label>
          <select id="year" name="year" defaultValue={year ?? ''} className="field">
            <option value="">Todos</option>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-blue">Filtrar</button>
        {(year || month) && (
          <Link href="/history" className="btn-ghost">Quitar filtro</Link>
        )}
      </Form>

      {error && (
        <p role="alert" className="notice-error">
          <span aria-hidden="true" className="mt-1 size-3 shrink-0 rounded-full bg-red" />
          {error.message}
        </p>
      )}

      {!error && sessions?.length === 0 && (
        <div className="card flex flex-col items-center gap-4 text-center">
          <div className="h-20 w-full overflow-hidden rounded-2xl border-2 border-blue">
            <GeometricPattern cols={10} rows={2} cell={32} seed={5} className="h-full w-full" />
          </div>
          <p className="text-lg font-bold">
            {isFiltered ? 'Ningún round ese mes. ¿Lo recuperamos?' : 'Aún no hay rounds. ¿Te animas al primero?'}
          </p>
          <Link href="/log" className="btn-primary">Empezar mi round</Link>
        </div>
      )}

      {sessions && sessions.length > 0 && (
        <ul className="flex flex-col gap-3">
          {sessions.map(session => {
            const { day, month: shortMonth, weekday } = dateParts(session.session_date);
            const time = formatTime(session.created_at);
            return (
              <li key={session.id}>
                <Link
                  href={`/history/${session.id}`}
                  className="flex items-center gap-4 rounded-3xl border-2 border-blue bg-cream p-3 pr-5 transition duration-150 hover:bg-yellow active:scale-[0.98]"
                >
                  <span className="flex size-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-blue text-cream">
                    <span className="text-2xl font-extrabold leading-none">{day}</span>
                    <span className="text-xs font-semibold uppercase">{shortMonth}</span>
                  </span>
                  <span className="flex flex-1 flex-col">
                    <span className="text-base font-bold capitalize">{weekday}</span>
                    {time && <span className="text-sm text-ink/80">{time} h</span>}
                  </span>
                  <span aria-hidden="true" className="text-xl font-bold text-blue">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {sessions && sessions.length > 0 && totalPages > 1 && (
        <nav aria-label="Paginación" className="flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={buildHref(page - 1, year, month)} className="btn-ghost">← Anterior</Link>
          ) : (
            <span />
          )}
          <span className="text-sm font-semibold text-ink/80">
            {page} de {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={buildHref(page + 1, year, month)} className="btn-ghost">Siguiente →</Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </main>
  );
}
