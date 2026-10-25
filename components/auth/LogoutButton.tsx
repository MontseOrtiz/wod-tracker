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
      className="min-h-11 rounded-full px-4 text-sm font-semibold text-blue transition duration-150 hover:bg-blue hover:text-cream active:scale-95"
    >
      Salir
    </button>
  );
}
