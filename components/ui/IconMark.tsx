// The logo mark with literal hex colors, for ImageResponse (app/icon.tsx and
// app/apple-icon.tsx), which renders outside the page and can't read CSS variables.
// Keep in step with Logo.tsx and the palette in globals.css.
const C = { cream: '#FAF0D7', yellow: '#FFC31B', blue: '#006994', pink: '#FF69B4', red: '#E5340B', ink: '#3F362A' };

export function IconMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: C.cream,
      }}
    >
      <svg
        width={size * 0.8}
        height={size * 0.8}
        viewBox="0 0 48 48"
        stroke={C.ink}
        strokeWidth={2.5}
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="19" height="19" rx="5" fill={C.yellow} />
        <polygon points="35,3 45,22 25,22" fill={C.pink} />
        <circle cx="12.5" cy="35.5" r="9.5" fill={C.red} />
        <rect x="26" y="26" width="19" height="19" rx="9.5" fill={C.blue} />
      </svg>
    </div>
  );
}
