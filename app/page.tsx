import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-16 flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">WOD Tracker</h1>
        <p className="text-text-secondary text-sm">Registra tus entrenamientos de CrossFit y sigue tu progreso.</p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/log"
          className="flex items-center justify-center bg-primary-strong text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 active:scale-[0.98] transition"
        >
          Iniciar entrenamiento de hoy
        </Link>
        <Link
          href="/history"
          className="flex items-center justify-center border border-text-secondary/30 bg-surface text-text-secondary px-6 py-3 rounded-xl font-medium hover:bg-surface-soft hover:border-primary/40 hover:text-primary-strong active:scale-[0.98] transition"
        >
          Ver historial
        </Link>
      </div>
    </main>
  );
}
