'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Inicio' },
  { href: '/log', label: 'Registrar' },
  { href: '/history', label: 'Historial' },
] as const;

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

// Floating pill at the thumb's reach: the main way around the app on a phone.
export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Principal"
      className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border-2 border-ink bg-blue p-1.5"
    >
      <ul className="flex items-center gap-1">
        {ITEMS.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition duration-150 active:scale-95 ${
                  active ? 'bg-yellow text-ink' : 'text-cream hover:bg-ink'
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
