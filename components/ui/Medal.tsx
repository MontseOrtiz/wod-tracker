// A flat 70s medal: hexagon, star and circle. Decorative; the text next to it says
// what it means. Pops in once, and not at all with reduced motion.
export function Medal({ size = 128, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`animate-pop ${className}`}
      stroke="var(--ink)"
      strokeWidth={3}
      strokeLinejoin="round"
    >
      <polygon points="60,6 106,33 106,87 60,114 14,87 14,33" fill="var(--pink)" />
      <circle cx="60" cy="60" r="34" fill="var(--yellow)" />
      <polygon
        points="60,34 67,52 86,52 71,63 77,82 60,70 43,82 49,63 34,52 53,52"
        fill="var(--red)"
      />
    </svg>
  );
}
