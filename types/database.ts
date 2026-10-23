import type { Tables } from "./supabase";

// Postgres stores these as `text` guarded by CHECK constraints, so the generated
// types see plain `string`. Narrow them here; `types/supabase.ts` is generated
// (npm run db:types) and must not be edited by hand.
export type BlockType = "warmup" | "strength_skill" | "wod";
export type WeightUnit = "kg" | "lb" | "%";

export type Session = Tables<"sessions">;
export type Block = Omit<Tables<"blocks">, "block_type"> & { block_type: BlockType };
export type Exercise = Omit<Tables<"exercises">, "unit"> & { unit: WeightUnit | null };
