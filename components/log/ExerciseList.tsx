import { makeExercise, type ExerciseRow } from '@/lib/log-form';
import { formatRepScheme, parseRepScheme, totalReps } from '@/lib/rep-scheme';

export function ExerciseList({
  exercises,
  onChange,
}: {
  exercises: ExerciseRow[];
  onChange: (rows: ExerciseRow[]) => void;
}) {
  function updateField<K extends keyof ExerciseRow>(id: string, field: K, value: ExerciseRow[K]) {
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
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => updateField(ex.id, 'isLadder', !ex.isLadder)}
                aria-pressed={ex.isLadder}
                className={`text-xs font-medium rounded-lg px-3 py-2 border transition ${
                  ex.isLadder
                    ? 'bg-primary/15 border-primary/40 text-primary-strong'
                    : 'border-text-secondary/25 text-text-secondary hover:text-primary-strong'
                }`}
              >
                Escalera
              </button>
              {exercises.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(ex.id)}
                  className="text-xs text-error-strong hover:opacity-70 transition px-3 py-2"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
          <input
            type="text"
            placeholder="Nombre del ejercicio (ej. Sentadilla trasera)"
            value={ex.exercise_name}
            onChange={e => updateField(ex.id, 'exercise_name', e.target.value)}
            className="w-full border border-text-secondary/25 rounded-lg px-3 py-2 text-sm bg-surface-soft text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
          />
          <div className="grid grid-cols-3 gap-2">
            {ex.isLadder ? (
              <div className="col-span-2 flex flex-col gap-1">
                <label htmlFor={`scheme-${ex.id}`} className="text-xs text-text-secondary">
                  Repeticiones por ronda
                </label>
                <input
                  id={`scheme-${ex.id}`}
                  type="text"
                  inputMode="numeric"
                  placeholder="10-15-20-15-10"
                  value={ex.repScheme}
                  onChange={e => updateField(ex.id, 'repScheme', e.target.value)}
                  className="border border-text-secondary/25 rounded-lg px-3 py-2 text-sm bg-surface-soft text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
                />
              </div>
            ) : (
              <>
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
              </>
            )}
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
                  onChange={e => updateField(ex.id, 'unit', e.target.value as ExerciseRow['unit'])}
                  className="border border-text-secondary/25 rounded-lg px-2 py-2 text-sm bg-surface-soft text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary"
                >
                  <option value="lb">lb</option>
                  <option value="kg">kg</option>
                  <option value="%">%</option>
                </select>
              </div>
            </div>
          </div>
          {ex.isLadder && ex.repScheme.trim() !== '' && (
            <p className="text-xs text-text-secondary" aria-live="polite">
              {(() => {
                const scheme = parseRepScheme(ex.repScheme);
                return scheme
                  ? `${formatRepScheme(scheme, ' · ')} — ${scheme.length} rondas, ${totalReps(scheme)} reps`
                  : 'Escribe al menos 2 rondas separadas por guiones, ej. 21-15-9';
              })()}
            </p>
          )}
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
