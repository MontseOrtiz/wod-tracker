-- Close every write path for the browser.
--
-- All writes now go through the Next.js server (POST /api/sessions), which validates
-- the input, uploads the photo and calls create_session with the service role.
-- The browser, which only has the anon key, may keep reading and nothing else.
--
-- !! Apply this only AFTER the version of the app that saves through the server is
-- !! deployed. The previous version inserts from the browser and would stop saving.

-- Tables: drop the INSERT policies and the privilege itself (belt and braces, so a
-- future permissive policy can't silently re-open writes).
DROP POLICY IF EXISTS "anon can insert sessions"  ON public.sessions;
DROP POLICY IF EXISTS "anon can insert blocks"    ON public.blocks;
DROP POLICY IF EXISTS "anon can insert exercises" ON public.exercises;

REVOKE INSERT ON public.sessions, public.blocks, public.exercises FROM anon, authenticated;

-- Storage: uploads now happen server-side with the service role, which bypasses RLS.
-- Reading stays public because the photos are shown with their public URL.
DROP POLICY IF EXISTS "Allow uploads to whiteboard-photos" ON storage.objects;
