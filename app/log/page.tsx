'use client';

import Link from 'next/link';
import { ExerciseList } from '@/components/log/ExerciseList';
import { StepIndicator } from '@/components/log/StepIndicator';
import { useWorkoutLog } from './useWorkoutLog';

export default function LogPage() {
  const {
    step,
    setStep,
    formData,
    updateField,
    selectedFile,
    setSelectedFile,
    isParsingPhoto,
    parseError,
    isSaving,
    error,
    handleAnalyzePhoto,
    handleSave,
  } = useWorkoutLog();

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
            onClick={() => {
              setSelectedFile(null);
              setStep(1);
            }}
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
