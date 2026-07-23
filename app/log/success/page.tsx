import Link from 'next/link';

export default function SuccessPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
      <div className="w-14 h-14 rounded-full bg-success/25 flex items-center justify-center">
        <svg
          className="w-7 h-7 text-success-strong"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h1 className="text-2xl font-semibold text-success-strong">¡Entrenamiento guardado!</h1>
      <p className="text-text-secondary">¡Buen trabajo hoy!</p>
      <Link
        href="/log"
        className="mt-4 bg-primary-strong text-white px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90 active:scale-[0.98] transition"
      >
        Registrar otro entrenamiento
      </Link>
      <Link
        href="/"
        className="px-6 py-2 rounded-xl text-sm font-medium border border-text-secondary/30 text-text-secondary hover:bg-surface-soft hover:border-primary/40 hover:text-primary-strong active:scale-[0.98] transition"
      >
        Inicio
      </Link>
    </main>
  );
}
