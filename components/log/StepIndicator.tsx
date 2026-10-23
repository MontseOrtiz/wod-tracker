const STEPS = ['Calentamiento', 'Fuerza / Habilidad', 'WOD'] as const;

export function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
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
