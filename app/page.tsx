import Link from 'next/link';
import { GeometricPattern, PatternDivider } from '@/components/ui/GeometricPattern';
import { Logo } from '@/components/ui/Logo';

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-6">
      {/* The pattern is the backdrop; the greeting sits on its own cream panel. */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-ink">
        <GeometricPattern animated cols={12} rows={7} className="absolute inset-0 h-full w-full" />
        <div className="relative flex justify-center px-5 py-12">
          <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-ink bg-cream px-6 py-6 text-center">
            <Logo size={56} />
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
              ¡Hola! ¿Cómo va tu groove hoy?
            </h1>
          </div>
        </div>
      </section>

      <section className="ticket flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-extrabold leading-tight">¿Listo para tu round?</h2>
          <p className="text-base">Una foto del WOD, un par de toques y queda guardado.</p>
        </div>
        <div className="border-t-2 border-dashed border-blue" />
        <Link href="/log" className="btn-blue hover-wiggle">
          Empezar mi round
        </Link>
      </section>

      <PatternDivider />
    </main>
  );
}
