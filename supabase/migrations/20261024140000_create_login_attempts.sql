-- Failed PIN attempts, used to lock the login after repeated failures.
--
-- Only the Next.js server touches this table (service role). RLS is on with no
-- policies and every browser role is revoked, so the anon key can neither read
-- nor write it.

CREATE TABLE public.login_attempts (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip         text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Lookups are "failures from this ip in the last N minutes" and "all failures in the last N minutes".
CREATE INDEX login_attempts_ip_created_at_idx ON public.login_attempts (ip, created_at DESC);
CREATE INDEX login_attempts_created_at_idx    ON public.login_attempts (created_at DESC);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.login_attempts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.login_attempts TO service_role;
