'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExerciseRow = {
  id: string;         // local key only — never sent to the database
  exercise_name: string;
  weight: string;     // string so the input can be empty; converted to number on save
  reps: string;
  sets: string;
  unit: 'kg' | 'lb' | '%';
};

type FormData = {
  warmupNotes: string;
  strengthExercises: ExerciseRow[];
  wodFormat: string;
  wodResult: string;
  wodExercises: ExerciseRow[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeExercise(): ExerciseRow {
  return { id: crypto.randomUUID(), exercise_name: '', weight: '', reps: '', sets: '', unit: 'lb' };
}

function getInitialData(): FormData {
  return {
    warmupNotes: '',
    strengthExercises: [makeExercise()],
    wodFormat: '',
    wodResult: '',
    wodExercises: [makeExercise()],
  };
}

function toInt(value: string): number | null {
  return value.trim() !== '' ? parseInt(value, 10) : null;
}

function toFloat(value: string): number | null {
  return value.trim() !== '' ? parseFloat(value) : null;
}

// ---------------------------------------------------------------------------
// ExerciseList — shared between Step 2 and Step 3
// ---------------------------------------------------------------------------

function ExerciseList({
  exercises,
  onChange,
}: {
  exercises: ExerciseRow[];
  onChange: (rows: ExerciseRow[]) => void;
}) {
  function updateField(id: string, field: keyof ExerciseRow, value: string) {
    onChange(exercises.map(ex => (ex.id === id ? { ...ex, [field]: value } : ex)));
  }

  function addRow() {
    onChange([...exercises, makeExercise()]);
  }

  function removeRow(id: string) {
    if (exercises.length === 1) return;
    onChange(exercises.filter(ex => ex.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      {exercises.map((ex, index) => (
        <div key={ex.id} className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Exercise {index + 1}
            </span>
            {exercises.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(ex.id)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Remove
              </button>
            )}
          </div>
          <input
            type="text"
            placeholder="Exercise name (e.g. Back Squat)"
            value={ex.exercise_name}
            onChange={e => updateField(ex.id, 'exercise_name', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Sets</label>
              <input
                type="number"
                placeholder="—"
                value={ex.sets}
                onChange={e => updateField(ex.id, 'sets', e.target.value)}
                min={0}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Reps</label>
              <input
                type="number"
                placeholder="—"
                value={ex.reps}
                onChange={e => updateField(ex.id, 'reps', e.target.value)}
                min={0}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Weight</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="—"
                  value={ex.weight}
                  onChange={e => updateField(ex.id, 'weight', e.target.value)}
                  min={0}
                  className="min-w-0 flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <select
                  value={ex.unit}
                  onChange={e => updateField(ex.id, 'unit', e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="lb">lb</option>
                  <option value="kg">kg</option>
                  <option value="%">%</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="self-start text-sm text-blue-600 hover:text-blue-800 font-medium"
      >
        + Add exercise
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

const STEPS = ['Warmup', 'Strength / Skill', 'WOD'] as const;

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((label, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <div key={label} className="flex items-center gap-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                ${isActive ? 'bg-black text-white' : isDone ? 'bg-gray-300 text-gray-600' : 'bg-gray-100 text-gray-400'}`}
            >
              {stepNum}
            </div>
            <span className={`text-sm ${isActive ? 'font-semibold' : 'text-gray-400'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="text-gray-200 mx-2 select-none">›</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LogPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<FormData>(getInitialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setIsSaving(true);
    setError(null);

    // 1 — Insert the session row
    const today = new Date().toISOString().split('T')[0];
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({ session_date: today, whiteboard_photo_url: null, notes: null })
      .select('id')
      .single();

    if (sessionError || !session) {
      setError(sessionError?.message ?? 'Failed to create session');
      setIsSaving(false);
      return;
    }

    // 2 — Insert the 3 block rows
    const { data: blocks, error: blocksError } = await supabase
      .from('blocks')
      .insert([
        {
          session_id: session.id,
          block_type: 'warmup' as const,
          notes: formData.warmupNotes.trim() || null,
          wod_format: null,
          result: null,
        },
        {
          session_id: session.id,
          block_type: 'strength_skill' as const,
          notes: null,
          wod_format: null,
          result: null,
        },
        {
          session_id: session.id,
          block_type: 'wod' as const,
          notes: null,
          wod_format: formData.wodFormat.trim() || null,
          result: formData.wodResult.trim() || null,
        },
      ])
      .select('id, block_type');

    if (blocksError || !blocks) {
      setError(blocksError?.message ?? 'Failed to create blocks');
      setIsSaving(false);
      return;
    }

    const strengthBlock = blocks.find(b => b.block_type === 'strength_skill')!;
    const wodBlock = blocks.find(b => b.block_type === 'wod')!;

    // 3 — Insert exercises (skip rows where the name is empty)
    const exercisesToInsert = [
      ...formData.strengthExercises
        .filter(ex => ex.exercise_name.trim())
        .map(ex => ({
          block_id: strengthBlock.id,
          exercise_name: ex.exercise_name.trim(),
          sets: toInt(ex.sets),
          reps: toInt(ex.reps),
          weight: toFloat(ex.weight),
          unit: toFloat(ex.weight) !== null ? ex.unit : null,
        })),
      ...formData.wodExercises
        .filter(ex => ex.exercise_name.trim())
        .map(ex => ({
          block_id: wodBlock.id,
          exercise_name: ex.exercise_name.trim(),
          sets: toInt(ex.sets),
          reps: toInt(ex.reps),
          weight: toFloat(ex.weight),
          unit: toFloat(ex.weight) !== null ? ex.unit : null,
        })),
    ];

    if (exercisesToInsert.length > 0) {
      const { error: exercisesError } = await supabase
        .from('exercises')
        .insert(exercisesToInsert);

      if (exercisesError) {
        setError(exercisesError.message);
        setIsSaving(false);
        return;
      }
    }

    router.push('/log/success');
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex justify-end mb-4">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">
          ← Home
        </Link>
      </div>
      <StepIndicator current={step} />

      {/* ── Step 1: Warmup ───────────────────────────────────── */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <h1 className="text-xl font-semibold">Warmup</h1>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600">Notes (optional)</label>
            <textarea
              rows={5}
              placeholder="e.g. 500m row, hip mobility, 3 rounds of..."
              value={formData.warmupNotes}
              onChange={e => updateField('warmupNotes', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Strength / Skill ─────────────────────────── */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <h1 className="text-xl font-semibold">Strength / Skill</h1>
          <ExerciseList
            exercises={formData.strengthExercises}
            onChange={rows => updateField('strengthExercises', rows)}
          />
          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: WOD ──────────────────────────────────────── */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <h1 className="text-xl font-semibold">WOD</h1>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">WOD format</label>
              <input
                type="text"
                placeholder="e.g. For Time, AMRAP 12, 21-15-9"
                value={formData.wodFormat}
                onChange={e => updateField('wodFormat', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-600">Your result</label>
              <input
                type="text"
                placeholder="e.g. 8:42 or 5 rounds + 3 reps"
                value={formData.wodResult}
                onChange={e => updateField('wodResult', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600">Exercises</label>
            <ExerciseList
              exercises={formData.wodExercises}
              onChange={rows => updateField('wodExercises', rows)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              disabled={isSaving}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40"
            >
              ← Back
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40"
            >
              {isSaving ? 'Saving…' : 'Save Workout'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
