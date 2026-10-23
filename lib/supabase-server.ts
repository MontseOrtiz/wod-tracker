import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Bypasses RLS. Server-only: `server-only` makes the build fail if a Client
// Component ever imports this, and the key has no NEXT_PUBLIC_ prefix.
// Created lazily so builds and pages that never write don't need the key.
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}
