// Workout of the Day types — fill these in as you build features

export type Workout = {
  id: string;
  date: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type WorkoutResult = {
  id: string;
  workout_id: string;
  score: string | null;
  notes: string | null;
  created_at: string;
};
