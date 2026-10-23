CREATE TABLE "public"."blocks" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "session_id" uuid                     NOT NULL,
  "block_type" text                     NOT NULL,
  "wod_format" text,
  "result"     text,
  "notes"      text,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "blocks_block_type_check" CHECK ((block_type = ANY (ARRAY['warmup'::text, 'strength_skill'::text, 'wod'::text]))),
  CONSTRAINT "blocks_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."exercises" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "block_id"      uuid                     NOT NULL,
  "exercise_name" text                     NOT NULL,
  "weight"        numeric,
  "reps"          integer,
  "sets"          integer,
  "created_at"    timestamp with time zone DEFAULT now(),
  "unit"          text                     DEFAULT 'lb'::text,
  CONSTRAINT "exercises_pkey" PRIMARY KEY (id),
  CONSTRAINT "exercises_unit_check" CHECK ((unit = ANY (ARRAY['kg'::text, 'lb'::text, '%'::text])))
);

CREATE TABLE "public"."sessions" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "session_date"         date                     NOT NULL,
  "whiteboard_photo_url" text,
  "notes"                text,
  "created_at"           timestamp with time zone DEFAULT now(),
  CONSTRAINT "sessions_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."exercises"
  ADD CONSTRAINT "exercises_block_id_fkey" FOREIGN KEY (block_id) REFERENCES public.blocks(id) ON DELETE CASCADE;

ALTER TABLE "public"."blocks"
  ADD CONSTRAINT "blocks_session_id_fkey" FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;

CREATE POLICY "Allow public read of whiteboard-photos" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'whiteboard-photos'::text));

CREATE POLICY "Allow uploads to whiteboard-photos" ON "storage"."objects"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((bucket_id = 'whiteboard-photos'::text));

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."blocks" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."blocks" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."blocks" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."blocks" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."exercises" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."exercises" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."exercises" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."exercises" TO "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sessions" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."sessions" FROM "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sessions" TO "postgres";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sessions" TO "service_role";

