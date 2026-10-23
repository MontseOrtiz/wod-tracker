import { makeExercise, type ExerciseRow } from '@/lib/log-form';

export function ExerciseList({
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
