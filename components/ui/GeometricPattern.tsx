// Decorative 70s grid: yellow squares, blue grid lines, and a few cells swapped for
// pink/red triangles and circles. Purely decorative (aria-hidden) and deterministic,
// so server and client render the same thing. Always sit content on a cream panel
// above it; the pattern must never be what the text reads against.

type Props = {
  cols?: number;
  rows?: number;
  cell?: number;
  /** Shifts which cells get a shape, so two patterns on one page don't match. */
  seed?: number;
  /** Lets the shaped cells sway. Honors prefers-reduced-motion via CSS. */
  animated?: boolean;
  className?: string;
};

type Kind = 'square' | 'pink-triangle' | 'red-circle' | 'red-triangle' | 'pink-circle';

function kindAt(col: number, row: number, seed: number): Kind {
  switch ((col * 7 + row * 13 + seed) % 11) {
    case 0:
    case 5:
      return 'pink-triangle';
    case 3:
    case 8:
      return 'red-circle';
    case 6:
      return 'red-triangle';
    case 9:
      return 'pink-circle';
    default:
      return 'square';
  }
}

export function GeometricPattern({ cols = 12, rows = 5, cell = 32, seed = 0, animated = false, className }: Props) {
  const width = cols * cell;
  const height = rows * cell;

  const cells = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const kind = kindAt(col, row, seed);
      const x = col * cell;
      const y = row * cell;
      const shaped = kind !== 'square';
      const pink = kind.startsWith('pink');
      const fill = pink ? 'var(--pink)' : 'var(--red)';
      const style = animated && shaped ? ({ '--d': `${((col + row) % 6) * 0.45}s` } as React.CSSProperties) : undefined;
      const cls = animated && shaped ? 'pattern-dance' : undefined;

      cells.push(
        <g key={`${col}-${row}`}>
          <rect x={x} y={y} width={cell} height={cell} fill={shaped ? 'var(--cream)' : 'var(--yellow)'} />
          {kind.endsWith('triangle') && (
            <polygon
              className={cls}
              style={style}
              fill={fill}
              points={`${x + cell / 2},${y + cell * 0.16} ${x + cell * 0.86},${y + cell * 0.84} ${x + cell * 0.14},${y + cell * 0.84}`}
            />
          )}
          {kind.endsWith('circle') && (
            <circle className={cls} style={style} fill={fill} cx={x + cell / 2} cy={y + cell / 2} r={cell * 0.32} />
          )}
        </g>
      );
    }
  }

  let grid = '';
  for (let c = 0; c <= cols; c++) grid += `M${c * cell} 0V${height}`;
  for (let r = 0; r <= rows; r++) grid += `M0 ${r * cell}H${width}`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {cells}
      <path d={grid} fill="none" stroke="var(--blue)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// A thin strip of the same pattern, used to separate sections.
export function PatternDivider({ seed = 3, className = '' }: { seed?: number; className?: string }) {
  return (
    <div className={`h-5 w-full overflow-hidden rounded-full border-2 border-blue ${className}`} aria-hidden="true">
      <GeometricPattern cols={28} rows={1} cell={16} seed={seed} className="h-full w-full" />
    </div>
  );
}
