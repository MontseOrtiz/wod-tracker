// The mark: four simple shapes in the palette. A square, a triangle, a circle and a
// pill, like a tiny version of the pattern.
export function Logo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      stroke="var(--ink)"
      strokeWidth={2.5}
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="19" height="19" rx="5" fill="var(--yellow)" />
      <polygon points="35,3 45,22 25,22" fill="var(--pink)" />
      <circle cx="12.5" cy="35.5" r="9.5" fill="var(--red)" />
      <rect x="26" y="26" width="19" height="19" rx="9.5" fill="var(--blue)" />
    </svg>
  );
}
