'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GeometricPattern } from '@/components/ui/GeometricPattern';

export function PinGate() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        // The cookie is set; re-render the layout on the server so it lets the page through.
        router.refresh();
        return;
      }
      const json = await res.json().catch(() => null);
      setError(json?.error ?? 'No se pudo verificar el PIN.');
    } catch {
      setError('No se pudo conectar con el servidor. Intenta de nuevo.');
    }
    setIsSubmitting(false);
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6">
      <div className="h-28 overflow-hidden rounded-3xl border-2 border-ink">
        <GeometricPattern animated cols={12} rows={4} seed={4} className="h-full w-full" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight">Acceso del propietario</h1>
        <p className="text-base text-ink/80">
          Registrar rounds requiere un PIN. El historial es público, míralo cuando quieras.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pin" className="field-label">PIN</label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="field"
          />
        </div>

        {error && (
          <p role="alert" className="notice-error">
            <span aria-hidden="true" className="mt-1 size-3 shrink-0 rounded-full bg-red" />
            {error}
          </p>
        )}

        <button type="submit" disabled={isSubmitting || !pin} className="btn-primary">
          {isSubmitting ? 'Verificando...' : 'Entrar'}
        </button>
      </form>

      <Link href="/history" className="btn-ghost self-start">Ver el historial</Link>
    </main>
  );
}
