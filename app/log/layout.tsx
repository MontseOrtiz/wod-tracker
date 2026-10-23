import type { Metadata } from 'next';
import { PinGate } from '@/components/auth/PinGate';
import { isAuthenticated } from '@/lib/auth-server';

export const metadata: Metadata = {
  title: 'Registrar entrenamiento',
};

export default async function LogLayout({ children }: { children: React.ReactNode }) {
  // Writing is owner-only: anyone else sees the PIN form instead of the wizard.
  if (!(await isAuthenticated())) return <PinGate />;
  return children;
}
