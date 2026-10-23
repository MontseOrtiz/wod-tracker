'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    <main className="max-w-lg mx-auto px-4 py-16 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-text-primary">Acceso del propietario</h1>
        <p className="text-sm text-text-secondary">
          Registrar entrenamientos requiere un PIN. El historial es público y puedes verlo sin él.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="pin" className="text-sm text-text-secondary">PIN</label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="w-full border border-text-secondary/25 rounded-lg px-3 py-3 text-base bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-error-strong bg-error/15 border border-error/30 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !pin}
          className="bg-primary-strong text-white px-6 py-3 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 active:scale-[0.98] transition"
        >
          {isSubmitting ? 'Verificando…' : 'Entrar'}
        </button>
      </form>

      <div className="flex gap-4 text-sm">
        <Link href="/history" className="text-primary-strong underline">Ver historial</Link>
        <Link href="/" className="text-text-secondary hover:text-primary-strong transition">← Inicio</Link>
      </div>
    </main>
  );
}
