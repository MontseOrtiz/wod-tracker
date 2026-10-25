import Link from 'next/link';
import { Medal } from '@/components/ui/Medal';

export default function SuccessPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center gap-6 px-4 py-10 text-center">
      <Medal />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight">¡Round guardado!</h1>
        <p className="text-lg">Ese combo fue épico 🎉</p>
      </div>
      <div className="flex w-full flex-col gap-3">
        <Link href="/log" className="btn-primary">Otro round</Link>
        <Link href="/history" className="btn-ghost">Ver mis rounds</Link>
      </div>
    </main>
  );
}
