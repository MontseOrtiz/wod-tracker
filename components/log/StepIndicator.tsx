const STEPS = ['Calentamiento', 'Fuerza / Habilidad', 'WOD'] as const;

// Segmented bar, not a circle: done segments are yellow, the current one is blue.
// Current step is also bold and announced with aria-current, so color is never the only cue.
export function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol aria-label="Progreso" className="mb-8 grid grid-cols-3 gap-2">
      {STEPS.map((label, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3;
        const isActive = stepNum === current;
        const isDone = stepNum < current;
        return (
          <li key={label} aria-current={isActive ? 'step' : undefined} className="flex flex-col gap-2">
            <span
              className={`h-3.5 rounded-full border-2 border-ink ${
                isDone ? 'bg-yellow' : isActive ? 'bg-blue' : 'bg-cream'
              }`}
            />
            <span className={`text-xs leading-tight sm:text-sm ${isActive ? 'font-bold' : 'font-medium text-ink/80'}`}>
              {stepNum}. {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
