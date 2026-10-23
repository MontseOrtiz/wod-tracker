-- Save a whole workout atomically.
--
-- The app used to run three separate inserts (session, blocks, exercises) from the
-- browser; a failure halfway left an orphan session. A plpgsql function runs inside
-- a single transaction, so either everything is saved or nothing is.
--
-- Only `service_role` may call it: the Next.js server does, after validating the
-- input. Once the browser stops writing, the anon INSERT policies can be dropped.
--
-- payload shape:
--   { session_date, photo_url, warmup_notes, wod_format, wod_result,
--     strength: [exercise], wod: [exercise] }
--   exercise = { exercise_name, weight, unit, reps, sets }

CREATE OR REPLACE FUNCTION public.create_session(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_session_id  uuid;
  v_strength_id uuid;
  v_wod_id      uuid;
BEGIN
  INSERT INTO public.sessions (session_date, whiteboard_photo_url)
  VALUES ((payload->>'session_date')::date, NULLIF(payload->>'photo_url', ''))
  RETURNING id INTO v_session_id;

  INSERT INTO public.blocks (session_id, block_type, notes)
  VALUES (v_session_id, 'warmup', NULLIF(payload->>'warmup_notes', ''));

  INSERT INTO public.blocks (session_id, block_type)
  VALUES (v_session_id, 'strength_skill')
  RETURNING id INTO v_strength_id;

  INSERT INTO public.blocks (session_id, block_type, wod_format, result)
  VALUES (
    v_session_id,
    'wod',
    NULLIF(payload->>'wod_format', ''),
    NULLIF(payload->>'wod_result', '')
  )
  RETURNING id INTO v_wod_id;

  INSERT INTO public.exercises (block_id, exercise_name, weight, unit, reps, sets)
  SELECT
    v_strength_id,
    e->>'exercise_name',
    (e->>'weight')::numeric,
    NULLIF(e->>'unit', ''),
    (e->>'reps')::integer,
    (e->>'sets')::integer
  FROM jsonb_array_elements(COALESCE(payload->'strength', '[]'::jsonb)) AS e;

  INSERT INTO public.exercises (block_id, exercise_name, weight, unit, reps, sets)
  SELECT
    v_wod_id,
    e->>'exercise_name',
    (e->>'weight')::numeric,
    NULLIF(e->>'unit', ''),
    (e->>'reps')::integer,
    (e->>'sets')::integer
  FROM jsonb_array_elements(COALESCE(payload->'wod', '[]'::jsonb)) AS e;

  RETURN v_session_id;
END;
$$;

-- Functions are executable by PUBLIC by default, and Supabase also grants new
-- functions to anon/authenticated explicitly; remove both.
REVOKE ALL ON FUNCTION public.create_session(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_session(jsonb) TO service_role;
