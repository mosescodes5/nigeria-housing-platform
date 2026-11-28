/** Placeholder illustration until licensed property photography is available. */
const PALETTES: [string, string][] = [
  ["#142D4E", "#15966B"],
  ["#1E3A5F", "#2BB58A"],
  ["#0F2745", "#1E8F73"],
];

/** Stable small number derived from a slug, to vary illustrations per listing. */
export function slugSeed(slug: string): number {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 1000;
}

export function PropertyArt({ seed }: { seed: number }) {
  const [a, b] = PALETTES[seed % PALETTES.length]!;
  const id = `art-${seed}`;
  return (
    <svg viewBox="0 0 400 260" role="img" aria-label="Illustration of a residential building" className="h-full w-full">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill={`url(#${id})`} />
      <g fill="#fff" fillOpacity="0.92">
        <rect x="120" y="100" width="160" height="110" rx="6" />
        <path d="M104 104 200 48l96 56z" />
      </g>
      <g fill={a} fillOpacity="0.85">
        <rect x="140" y="122" width="30" height="30" rx="4" />
        <rect x="230" y="122" width="30" height="30" rx="4" />
        <rect x="182" y="160" width="36" height="50" rx="4" />
      </g>
    </svg>
  );
}
