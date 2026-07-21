export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          session_date: string;
          whiteboard_photo_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_date: string;
          whiteboard_photo_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_date?: string;
          whiteboard_photo_url?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      blocks: {
        Row: {
          id: string;
          session_id: string;
          block_type: "warmup" | "strength_skill" | "wod";
          wod_format: string | null;
          result: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          block_type: "warmup" | "strength_skill" | "wod";
          wod_format?: string | null;
          result?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          block_type?: "warmup" | "strength_skill" | "wod";
          wod_format?: string | null;
          result?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          block_id: string;
          exercise_name: string;
          weight: number | null;
          reps: number | null;
          sets: number | null;
          unit: 'kg' | 'lb' | '%' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          block_id: string;
          exercise_name: string;
          weight?: number | null;
          reps?: number | null;
          sets?: number | null;
          unit?: 'kg' | 'lb' | '%' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          block_id?: string;
          exercise_name?: string;
          weight?: number | null;
          reps?: number | null;
          sets?: number | null;
          unit?: 'kg' | 'lb' | '%' | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience types — use these throughout the app instead of the long Database path
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type Block = Database["public"]["Tables"]["blocks"]["Row"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
