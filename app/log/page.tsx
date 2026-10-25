'use client';

import { ExerciseList } from '@/components/log/ExerciseList';
import { StepIndicator } from '@/components/log/StepIndicator';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { useWorkoutLog } from './useWorkoutLog';

function ErrorNotice({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="notice-error">
      <span aria-hidden="true" className="mt-1 size-3 shrink-0 rounded-full bg-red" />
      {children}
    </p>
  );
}

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
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <div className="mb-4 flex justify-end">
        <LogoutButton />
      </div>
      {step !== 0 && <StepIndicator current={step} />}

      {/* Step 0: photo */}
      {step === 0 && (
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">Muéstrame el WOD</h1>

          <div>
            <input
              id="photo"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
              className="peer sr-only"
            />
            <label
              htmlFor="photo"
              className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-blue bg-cream p-6 text-center transition duration-150 hover:bg-yellow active:scale-[0.98] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-blue"
            >
              <span aria-hidden="true" className="flex items-end gap-2">
                <span className="size-9 rounded-md border-2 border-ink bg-yellow" />
                <span className="size-9 rounded-full border-2 border-ink bg-red" />
                <span className="size-9 border-2 border-ink bg-pink [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
              </span>
              <span className="text-lg font-bold">
                {selectedFile ? selectedFile.name : 'Toca para sacar o elegir una foto'}
              </span>
              <span className="text-sm text-ink/80">
                {selectedFile ? 'Toca de nuevo para cambiarla' : 'La pantalla del box o el pizarrón, como salga'}
              </span>
            </label>
          </div>

          {parseError && <ErrorNotice>{parseError}</ErrorNotice>}

          <div className="flex flex-col gap-3">
            <button
              onClick={handleAnalyzePhoto}
              disabled={isParsingPhoto || !selectedFile}
              className={`btn-primary w-full ${isParsingPhoto ? 'animate-pulse-bar' : ''}`}
            >
              {isParsingPhoto ? 'Leyendo tu WOD...' : 'Leer mi WOD'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setStep(1);
              }}
              disabled={isParsingPhoto}
              className="btn-ghost w-full"
            >
              Omitir y llenarlo a mano
            </button>
          </div>
        </div>
      )}

      {/* Step 1: warmup */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">Calentamiento</h1>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="warmup-notes" className="field-label">Notas (opcional)</label>
            <textarea
              id="warmup-notes"
              rows={5}
              placeholder="ej. 500 m de remo, movilidad de cadera, 3 rondas de..."
              value={formData.warmupNotes}
              onChange={e => updateField('warmupNotes', e.target.value)}
              className="field resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button onClick={() => setStep(2)} className="btn-primary">Siguiente →</button>
          </div>
        </div>
      )}

      {/* Step 2: strength / skill */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">Fuerza / Habilidad</h1>
          <ExerciseList
            exercises={formData.strengthExercises}
            onChange={rows => updateField('strengthExercises', rows)}
          />
          <div className="flex justify-between gap-3">
            <button onClick={() => setStep(1)} className="btn-ghost">← Atrás</button>
            <button onClick={() => setStep(3)} className="btn-primary">Siguiente →</button>
          </div>
        </div>
      )}

      {/* Step 3: WOD */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">WOD</h1>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="wod-format" className="field-label">Formato del WOD</label>
              <input
                id="wod-format"
                type="text"
                placeholder="ej. For Time, AMRAP 12, 21-15-9"
                value={formData.wodFormat}
                onChange={e => updateField('wodFormat', e.target.value)}
                className="field"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="wod-result" className="field-label">Tu resultado</label>
              <input
                id="wod-result"
                type="text"
                placeholder="ej. 8:42 o 5 rondas + 3 reps"
                value={formData.wodResult}
                onChange={e => updateField('wodResult', e.target.value)}
                className="field"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold">Ejercicios</h2>
            <ExerciseList
              exercises={formData.wodExercises}
              onChange={rows => updateField('wodExercises', rows)}
            />
          </div>

          {error && <ErrorNotice>{error}</ErrorNotice>}

          <div className="flex justify-between gap-3">
            <button onClick={() => setStep(2)} disabled={isSaving} className="btn-ghost">← Atrás</button>
            <button onClick={handleSave} disabled={isSaving} className="btn-primary">
              {isSaving ? 'Guardando...' : 'Guardar mi round'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
