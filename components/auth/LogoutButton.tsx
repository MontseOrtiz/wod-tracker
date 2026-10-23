'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  async function handleClick() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-sm text-text-secondary hover:text-primary-strong transition px-2 py-2"
    >
      Salir
    </button>
  );
}
