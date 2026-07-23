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
  photoUrl: string | null;
  warmupNotes: string;
  strengthExercises: ExerciseRow[];
  wodFormat: string;
  wodResult: string;
  wodExercises: ExerciseRow[];
};

// ---------------------------------------------------------------------------
// Gemini parse-workout response shape
// ---------------------------------------------------------------------------

type GeminiExercise = {
  exercise_name: string;
  weight: number | null;
  unit: 'kg' | 'lb' | '%' | null;
  reps: number | null;
  sets: number | null;
};

type GeminiParsedWorkout = {
  warmup_notes: string;
  strength_skill: GeminiExercise[];
  wod: {
    wod_format: string;
    result: string;
    exercises: GeminiExercise[];
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeExercise(): ExerciseRow {
  return { id: crypto.randomUUID(), exercise_name: '', weight: '', reps: '', sets: '', unit: 'lb' };
}

function getInitialData(): FormData {
  return {
    photoUrl: null,
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

function hasValidWorkoutData(formData: FormData): boolean {
  const hasWarmup = formData.warmupNotes.trim() !== '';
  const hasStrength = formData.strengthExercises.some(ex => ex.exercise_name.trim() !== '');
  const hasWod =
    formData.wodFormat.trim() !== '' ||
    formData.wodResult.trim() !== '' ||
    formData.wodExercises.some(ex => ex.exercise_name.trim() !== '');
  return hasWarmup || hasStrength || hasWod;
}

function toExerciseRows(exercises: GeminiExercise[] | undefined): ExerciseRow[] {
  if (!exercises || exercises.length === 0) return [makeExercise()];
  return exercises.map(ex => ({
    id: crypto.randomUUID(),
    exercise_name: ex.exercise_name ?? '',
    weight: ex.weight != null ? String(ex.weight) : '',
    reps: ex.reps != null ? String(ex.reps) : '',
    sets: ex.sets != null ? String(ex.sets) : '',
    unit: ex.unit ?? 'lb',
  }));
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
        <div
          key={ex.id}
          className="flex flex-col gap-2 p-3 bg-surface border border-primary/10 rounded-2xl shadow-[0_1px_3px_rgba(75,68,83,0.05)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Ejercicio {index + 1}
            </span>
            {exercises.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(ex.id)}
                className="text-xs text-error-strong hover:opacity-70 transition"
              >
                Eliminar
              </button>
            )}
          </div>
          <input
            type="text"
            placeholder="Nombre del ejercicio (ej. Sentadilla trasera)"
            value={ex.exercise_name}
            onChange={e => updateField(ex.id, 'exercise_name', e.target.value)}
            className="w-full border border-text-secondary/25 rounded-lg px-3 py-2 text-sm bg-surface-soft text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
          />
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary">Series</label>
              <input
                type="number"
                placeholder="—"
                value={ex.sets}
                onChange={e => updateField(ex.id, 'sets', e.target.value)}
                min={0}
                className="border border-text-secondary/25 rounded-lg px-3 py-2 text-sm bg-surface-soft text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary">Reps</label>
              <input
                type="number"
                placeholder="—"
                value={ex.reps}
                onChange={e => updateField(ex.id, 'reps', e.target.value)}
                min={0}
                className="border border-text-secondary/25 rounded-lg px-3 py-2 text-sm bg-surface-soft text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary">Peso</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="—"
                  value={ex.weight}
                  onChange={e => updateField(ex.id, 'weight', e.target.value)}
                  min={0}
                  className="min-w-0 flex-1 border border-text-secondary/25 rounded-lg px-3 py-2 text-sm bg-surface-soft text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
                />
                <select
                  value={ex.unit}
                  onChange={e => updateField(ex.id, 'unit', e.target.value)}
                  className="border border-text-secondary/25 rounded-lg px-2 py-2 text-sm bg-surface-soft text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
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
        className="self-start text-sm text-primary-strong hover:opacity-70 font-medium transition"
      >
        + Agregar ejercicio
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

const STEPS = ['Calentamiento', 'Fuerza / Habilidad', 'WOD'] as const;

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
                ${isActive ? 'bg-primary-strong text-white' : isDone ? 'bg-secondary text-text-primary' : 'bg-surface-soft text-text-secondary border border-text-secondary/20'}`}
            >
              {stepNum}
            </div>
            <span className={`text-sm ${isActive ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="text-text-secondary/40 mx-2 select-none">›</span>
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
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [formData, setFormData] = useState<FormData>(getInitialData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsingPhoto, setIsParsingPhoto] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  async function handleAnalyzePhoto() {
    if (!selectedFile) {
      setParseError('Selecciona una foto primero.');
      return;
    }

    setIsParsingPhoto(true);
    setParseError(null);

    try {
      const body = new FormData();
      body.append('image', selectedFile);

      const res = await fetch('/api/parse-workout', { method: 'POST', body });
      const json = await res.json();

      if (!res.ok) {
        setParseError(json.error ?? 'No se pudo leer la foto.');
        setIsParsingPhoto(false);
        return;
      }

      const { photoUrl, data } = json as { photoUrl: string; data: GeminiParsedWorkout };

      setFormData(prev => ({
        ...prev,
        photoUrl,
        warmupNotes: data.warmup_notes ?? '',
        strengthExercises: toExerciseRows(data.strength_skill),
        wodFormat: data.wod?.wod_format ?? '',
        wodExercises: toExerciseRows(data.wod?.exercises),
      }));
      setStep(1);
    } catch {
      setParseError('No se pudo conectar con el servidor. Intenta de nuevo.');
    } finally {
      setIsParsingPhoto(false);
    }
  }

  async function handleSave() {
    if (!hasValidWorkoutData(formData)) {
      setError('Registra al menos un dato del entrenamiento antes de guardar.');
      return;
    }

    setIsSaving(true);
    setError(null);

    // 1 — Insert the session row
    const today = new Date().toISOString().split('T')[0];
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({ session_date: today, whiteboard_photo_url: formData.photoUrl, notes: null })
      .select('id')
      .single();

    if (sessionError || !session) {
      setError(sessionError?.message ?? 'No se pudo crear la sesión');
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
      setError(blocksError?.message ?? 'No se pudieron crear los bloques');
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
        <Link href="/" className="text-sm text-text-secondary hover:text-primary-strong transition">
          ← Inicio
        </Link>
      </div>
      {step !== 0 && <StepIndicator current={step} />}

      {/* ── Step 0: Photo upload ─────────────────────────────── */}
      {step === 0 && (
        <div className="flex flex-col gap-6">
          <h1 className="text-xl font-semibold text-text-primary">Sube la foto del pizarrón</h1>

          <div className="flex flex-col items-center gap-3 border-2 border-dashed border-primary/30 bg-surface-soft rounded-2xl p-6 text-center">
            <p className="text-sm text-text-secondary">
              {selectedFile ? selectedFile.name : 'Toma o selecciona una foto del pizarrón'}
            </p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
              className="text-sm text-text-primary file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/20 file:text-primary-strong file:text-sm file:font-medium hover:file:bg-primary/30 file:transition"
            />
          </div>

          {parseError && (
            <p className="text-sm text-error-strong bg-error/15 border border-error/30 rounded-xl px-3 py-2">
              {parseError}
            </p>
          )}

          <button
            onClick={handleAnalyzePhoto}
            disabled={isParsingPhoto || !selectedFile}
            className={`px-6 py-2 rounded-xl text-sm font-medium transition active:scale-[0.98] disabled:active:scale-100 ${
              isParsingPhoto
                ? 'bg-info text-text-primary disabled:opacity-100'
                : 'bg-primary-strong text-white hover:opacity-90 disabled:opacity-40'
            }`}
          >
            {isParsingPhoto ? 'Leyendo el pizarrón...' : 'Analizar foto'}
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            disabled={isParsingPhoto}
            className="text-sm text-text-secondary hover:text-primary-strong underline self-center disabled:opacity-40 transition"
          >
            Omitir y llenar manualmente
          </button>
        </div>
      )}

      {/* ── Step 1: Warmup ───────────────────────────────────── */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <h1 className="text-xl font-semibold text-text-primary">Calentamiento</h1>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-text-secondary">Notas (opcional)</label>
            <textarea
              rows={5}
              placeholder="ej. 500m remo, movilidad de cadera, 3 rondas de..."
              value={formData.warmupNotes}
              onChange={e => updateField('warmupNotes', e.target.value)}
              className="w-full border border-text-secondary/25 rounded-lg px-3 py-2 text-sm resize-none bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="bg-primary-strong text-white px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90 active:scale-[0.98] transition"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Strength / Skill ─────────────────────────── */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <h1 className="text-xl font-semibold text-text-primary">Fuerza / Habilidad</h1>
          <ExerciseList
            exercises={formData.strengthExercises}
            onChange={rows => updateField('strengthExercises', rows)}
          />
          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="border border-text-secondary/30 text-text-secondary px-6 py-2 rounded-xl text-sm font-medium hover:border-primary/40 hover:text-primary-strong active:scale-[0.98] transition"
            >
              ← Atrás
            </button>
            <button
              onClick={() => setStep(3)}
              className="bg-primary-strong text-white px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90 active:scale-[0.98] transition"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: WOD ──────────────────────────────────────── */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <h1 className="text-xl font-semibold text-text-primary">WOD</h1>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm text-text-secondary">Formato del WOD</label>
              <input
                type="text"
                placeholder="ej. For Time, AMRAP 12, 21-15-9"
                value={formData.wodFormat}
                onChange={e => updateField('wodFormat', e.target.value)}
                className="w-full border border-text-secondary/25 rounded-lg px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-text-secondary">Tu resultado</label>
              <input
                type="text"
                placeholder="ej. 8:42 o 5 rondas + 3 reps"
                value={formData.wodResult}
                onChange={e => updateField('wodResult', e.target.value)}
                className="w-full border border-text-secondary/25 rounded-lg px-3 py-2 text-sm bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-text-secondary">Ejercicios</label>
            <ExerciseList
              exercises={formData.wodExercises}
              onChange={rows => updateField('wodExercises', rows)}
            />
          </div>

          {error && (
            <p className="text-sm text-error-strong bg-error/15 border border-error/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              disabled={isSaving}
              className="border border-text-secondary/30 text-text-secondary px-6 py-2 rounded-xl text-sm font-medium hover:border-primary/40 hover:text-primary-strong disabled:opacity-40 active:scale-[0.98] transition"
            >
              ← Atrás
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-primary-strong text-white px-6 py-2 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 active:scale-[0.98] transition"
            >
              {isSaving ? 'Guardando…' : 'Guardar entrenamiento'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
