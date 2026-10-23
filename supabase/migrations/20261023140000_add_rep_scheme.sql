-- Rep ladders (10-15-20-15-10, 21-15-9, ...).
--
-- `rep_scheme` holds the reps of each round in order. It is optional: a plain
-- "5 x 5" keeps using `sets` and `reps`. When a scheme is present, `sets` is the
-- number of rounds (set by the app) and `reps` is null, so existing rows need no
-- migration. The total volume of a ladder is sum(rep_scheme).

ALTER TABLE public.exercises
  ADD COLUMN rep_scheme integer[];

ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_rep_scheme_check CHECK (
    rep_scheme IS NULL OR (
      cardinality(rep_scheme) BETWEEN 1 AND 50
      AND array_position(rep_scheme, NULL) IS NULL
      AND 0 < ALL (rep_scheme)
    )
  );

-- create_session now reads `rep_scheme` from each exercise.
-- exercise = { exercise_name, weight, unit, reps, sets, rep_scheme }
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

  INSERT INTO public.exercises (block_id, exercise_name, weight, unit, reps, sets, rep_scheme)
  SELECT
    v_strength_id,
    e->>'exercise_name',
    (e->>'weight')::numeric,
    NULLIF(e->>'unit', ''),
    (e->>'reps')::integer,
    (e->>'sets')::integer,
    CASE WHEN jsonb_typeof(e->'rep_scheme') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(e->'rep_scheme')::integer)
    END
  FROM jsonb_array_elements(COALESCE(payload->'strength', '[]'::jsonb)) AS e;

  INSERT INTO public.exercises (block_id, exercise_name, weight, unit, reps, sets, rep_scheme)
  SELECT
    v_wod_id,
    e->>'exercise_name',
    (e->>'weight')::numeric,
    NULLIF(e->>'unit', ''),
    (e->>'reps')::integer,
    (e->>'sets')::integer,
    CASE WHEN jsonb_typeof(e->'rep_scheme') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(e->'rep_scheme')::integer)
    END
  FROM jsonb_array_elements(COALESCE(payload->'wod', '[]'::jsonb)) AS e;

  RETURN v_session_id;
END;
$$;

-- CREATE OR REPLACE keeps the existing grants; restated so the file is self-contained.
REVOKE ALL ON FUNCTION public.create_session(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_session(jsonb) TO service_role;
