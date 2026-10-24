/**
 * Hero art — "options resolve into a shared plan."
 * Three candidate cards converge, arcs draw in, one plan settles. CSS-animated
 * transforms/opacity only; fully static under prefers-reduced-motion.
 */
export function Constellation() {
  return (
    <svg
      viewBox="0 0 560 440"
      className="constellation"
      role="img"
      aria-label="Illustration: three event options connecting into one shared plan"
    >
      {/* connecting arcs (drawn in via CSS) */}
      <path className="cc-draw d1" d="M140 96 C 200 120, 230 170, 268 208" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
      <path className="cc-draw d2" d="M448 88 C 400 130, 340 165, 292 204" fill="none" stroke="var(--coral)" strokeWidth="2.5" strokeLinecap="round" />
      <path className="cc-draw d3" d="M196 340 C 226 300, 248 262, 266 236" fill="none" stroke="var(--sage)" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
      <path className="cc-draw d4" d="M420 336 C 380 300, 340 262, 300 232" fill="none" stroke="var(--saffron)" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />

      {/* candidate cards */}
      <g className="float f1">
        <rect x="72" y="52" width="136" height="88" rx="14" fill="var(--surface-2)" stroke="var(--border)" />
        <rect x="88" y="70" width="70" height="9" rx="4.5" fill="var(--ink)" opacity="0.85" />
        <rect x="88" y="88" width="104" height="6" rx="3" fill="var(--ink)" opacity="0.3" />
        <rect x="88" y="100" width="88" height="6" rx="3" fill="var(--ink)" opacity="0.3" />
        <circle cx="192" cy="70" r="8" fill="var(--accent)" opacity="0.9" />
      </g>
      <g className="float f2">
        <rect x="392" y="44" width="136" height="88" rx="14" fill="var(--surface-2)" stroke="var(--border)" />
        <rect x="408" y="62" width="84" height="9" rx="4.5" fill="var(--coral)" />
        <rect x="408" y="80" width="100" height="6" rx="3" fill="var(--ink)" opacity="0.3" />
        <rect x="408" y="92" width="76" height="6" rx="3" fill="var(--ink)" opacity="0.3" />
      </g>
      <g className="float f3">
        <rect x="120" y="316" width="120" height="76" rx="14" fill="var(--surface-2)" stroke="var(--border)" />
        <rect x="134" y="332" width="62" height="8" rx="4" fill="var(--sage)" />
        <rect x="134" y="348" width="88" height="6" rx="3" fill="var(--ink)" opacity="0.3" />
      </g>
      <g className="float f4">
        <rect x="356" y="312" width="128" height="76" rx="14" fill="var(--surface-2)" stroke="var(--border)" />
        <rect x="370" y="328" width="70" height="8" rx="4" fill="var(--saffron)" />
        <rect x="370" y="344" width="92" height="6" rx="3" fill="var(--ink)" opacity="0.3" />
      </g>

      {/* the shared plan */}
      <g className="settle">
        <rect x="212" y="180" width="176" height="100" rx="18" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.5" />
        <circle cx="240" cy="208" r="9" fill="var(--accent)" />
        <circle cx="262" cy="208" r="9" fill="var(--coral)" />
        <circle cx="284" cy="208" r="9" fill="var(--saffron)" />
        <circle cx="306" cy="208" r="9" fill="var(--sage)" />
        <rect x="236" y="230" width="106" height="9" rx="4.5" fill="var(--ink)" opacity="0.85" />
        <rect x="236" y="248" width="128" height="6" rx="3" fill="var(--ink)" opacity="0.3" />
        <rect x="236" y="260" width="88" height="6" rx="3" fill="var(--ink)" opacity="0.3" />
        <text x="300" y="196" textAnchor="middle" className="constellation-label">shared plan</text>
      </g>
    </svg>
  );
}
