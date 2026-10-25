import Link from 'next/link';
import { GeometricPattern } from '@/components/ui/GeometricPattern';

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6">
      <div className="h-36 overflow-hidden rounded-3xl border-2 border-ink">
        <GeometricPattern animated cols={12} rows={5} seed={7} className="h-full w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight">Esta página se perdió en el groove</h1>
        <p className="text-base text-ink/80">No encontramos lo que buscabas. Puede que el round ya no exista.</p>
      </div>
      <Link href="/" className="btn-primary self-start">Volver al inicio</Link>
    </main>
  );
}
