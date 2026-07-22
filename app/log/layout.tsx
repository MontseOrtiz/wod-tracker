import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log Workout',
};

export default function LogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
