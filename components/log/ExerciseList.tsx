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
    <div className="flex flex-col gap-4">
      {exercises.map((ex, index) => {
        const scheme = ex.isLadder ? parseRepScheme(ex.repScheme) : null;

        return (
          <div key={ex.id} className="card flex flex-col gap-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-base font-bold">Ejercicio {index + 1}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateField(ex.id, 'isLadder', !ex.isLadder)}
                  aria-pressed={ex.isLadder}
                  className={`min-h-11 rounded-full border-2 px-4 text-sm font-semibold transition duration-150 active:scale-95 ${
                    ex.isLadder
                      ? 'border-blue bg-blue text-cream'
                      : 'border-blue bg-cream text-blue hover:bg-blue hover:text-cream'
                  }`}
                >
                  Escalera
                </button>
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(ex.id)}
                    className="min-h-11 rounded-full border-2 border-red bg-cream px-4 text-sm font-semibold text-ink transition duration-150 hover:bg-yellow active:scale-95"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${ex.id}-name`} className="field-label">Nombre del ejercicio</label>
              <input
                id={`${ex.id}-name`}
                type="text"
                placeholder="ej. Sentadilla trasera"
                value={ex.exercise_name}
                onChange={e => updateField(ex.id, 'exercise_name', e.target.value)}
                className="field"
              />
            </div>

            {ex.isLadder ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${ex.id}-scheme`} className="field-label">Repeticiones por ronda</label>
                <input
                  id={`${ex.id}-scheme`}
                  type="text"
                  inputMode="numeric"
                  placeholder="10-15-20-15-10"
                  value={ex.repScheme}
                  onChange={e => updateField(ex.id, 'repScheme', e.target.value)}
                  className="field"
                />
                {ex.repScheme.trim() !== '' && (
                  <div aria-live="polite" className="flex flex-col gap-2 pt-1">
                    {scheme ? (
                      <>
                        <ul className="flex flex-wrap gap-1.5">
                          {scheme.map((reps, i) => (
                            <li
                              key={i}
                              className="rounded-full border-2 border-ink bg-yellow px-3 py-0.5 text-sm font-bold"
                            >
                              {reps}
                            </li>
                          ))}
                        </ul>
                        <p className="text-sm font-medium text-ink/80">
                          {scheme.length} rondas, {totalReps(scheme)} reps ({formatRepScheme(scheme)})
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-medium">Escribe al menos 2 rondas separadas por guiones, ej. 21-15-9</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${ex.id}-sets`} className="field-label">Series</label>
                  <input
                    id={`${ex.id}-sets`}
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={ex.sets}
                    onChange={e => updateField(ex.id, 'sets', e.target.value)}
                    min={0}
                    className="field"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${ex.id}-reps`} className="field-label">Reps</label>
                  <input
                    id={`${ex.id}-reps`}
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={ex.reps}
                    onChange={e => updateField(ex.id, 'reps', e.target.value)}
                    min={0}
                    className="field"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor={`${ex.id}-weight`} className="field-label">Peso</label>
              <div className="flex gap-2">
                <input
                  id={`${ex.id}-weight`}
                  type="number"
                  inputMode="decimal"
                  placeholder="0"
                  value={ex.weight}
                  onChange={e => updateField(ex.id, 'weight', e.target.value)}
                  min={0}
                  className="field min-w-0 flex-1"
                />
                <select
                  aria-label="Unidad del peso"
                  value={ex.unit}
                  onChange={e => updateField(ex.id, 'unit', e.target.value as ExerciseRow['unit'])}
                  className="field w-24 shrink-0"
                >
                  <option value="lb">lb</option>
                  <option value="kg">kg</option>
                  <option value="%">%</option>
                </select>
              </div>
            </div>
          </div>
        );
      })}

      <button type="button" onClick={addRow} className="btn-ghost self-start">
        + Otro ejercicio
      </button>
    </div>
  );
}
