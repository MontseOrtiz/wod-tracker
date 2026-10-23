-- Harden database access.
--
-- Before: RLS was off on every table and `anon` (whose key ships in the browser
-- bundle) could UPDATE, DELETE and TRUNCATE everything.
-- After: RLS is on and `anon` can only SELECT and INSERT, which is exactly what
-- the app does today. Step 6 of the plan closes writes completely.

-- 1. Row Level Security ------------------------------------------------------

ALTER TABLE public.sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read sessions"   ON public.sessions  FOR SELECT TO anon USING (true);
CREATE POLICY "anon can insert sessions" ON public.sessions  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can read blocks"     ON public.blocks    FOR SELECT TO anon USING (true);
CREATE POLICY "anon can insert blocks"   ON public.blocks    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can read exercises"   ON public.exercises FOR SELECT TO anon USING (true);
CREATE POLICY "anon can insert exercises" ON public.exercises FOR INSERT TO anon WITH CHECK (true);

-- 2. Privileges ----------------------------------------------------------------
-- RLS has no policy for UPDATE/DELETE, so those are already denied; revoking the
-- grants as well means a mistaken policy later can't silently re-open them.

REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON public.sessions, public.blocks, public.exercises
  FROM anon, authenticated;

-- 3. Indexes for the app's access patterns -------------------------------------

CREATE INDEX IF NOT EXISTS blocks_session_id_idx     ON public.blocks (session_id);
CREATE INDEX IF NOT EXISTS exercises_block_id_idx    ON public.exercises (block_id);
CREATE INDEX IF NOT EXISTS sessions_session_date_idx ON public.sessions (session_date DESC);

-- 4. One block of each type per session ----------------------------------------
-- Fails if existing data already has duplicates; see the pre-check in the PR.

ALTER TABLE public.blocks
  ADD CONSTRAINT blocks_session_id_block_type_key UNIQUE (session_id, block_type);

-- 5. Make the Storage bucket reproducible ----------------------------------------
-- `db pull` captured the bucket's policies but not the bucket itself.

INSERT INTO storage.buckets (id, name, public)
VALUES ('whiteboard-photos', 'whiteboard-photos', true)
ON CONFLICT (id) DO NOTHING;
