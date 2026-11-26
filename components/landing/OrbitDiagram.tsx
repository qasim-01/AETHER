'use client';

/** Animated vector diagram: a particle orbiting a node with its pull and swirl vectors. */
export default function OrbitDiagram() {
  const C = 260;
  const R = 150;
  return (
    <svg viewBox="0 0 520 520" className="h-full w-full" role="img" aria-label="Diagram of radial and tangential force vectors on an orbiting particle">
      <defs>
        <radialGradient id="od-core">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#00f3ff" />
          <stop offset="100%" stopColor="#00f3ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="od-trail" gradientUnits="userSpaceOnUse" x1={C} y1={C - R} x2={C + R} y2={C}>
          <stop offset="0%" stopColor="#ff0099" stopOpacity="0" />
          <stop offset="100%" stopColor="#ff0099" stopOpacity="0.9" />
        </linearGradient>
        {[
          ['od-a-cyan', '#00f3ff'],
          ['od-a-purple', '#b46bff'],
          ['od-a-pink', '#ff0099'],
        ].map(([id, c]) => (
          <marker key={id} id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={c} />
          </marker>
        ))}
      </defs>

      {/* field rings */}
      {[60, 105, 150, 195, 240].map((r, i) => (
        <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="white" strokeOpacity={0.09 - i * 0.012} strokeDasharray={i % 2 ? '2 6' : undefined} />
      ))}
      <circle cx={C} cy={C} r="70" fill="url(#od-core)" opacity="0.5">
        <animate attributeName="r" values="62;74;62" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx={C} cy={C} r="7" fill="#00f3ff" />

      {/* orbiting particle + vectors */}
      <g>
        <animateTransform attributeName="transform" type="rotate" from={`0 ${C} ${C}`} to={`360 ${C} ${C}`} dur="9s" repeatCount="indefinite" />
        <path d={`M ${C} ${C - R} A ${R} ${R} 0 0 1 ${C + R} ${C}`} fill="none" stroke="url(#od-trail)" strokeWidth="2.5" />
        {/* radial pull û */}
        <line x1={C + R} y1={C} x2={C + R - 70} y2={C} stroke="#00f3ff" strokeWidth="2" markerEnd="url(#od-a-cyan)" />
        {/* tangent τ̂ */}
        <line x1={C + R} y1={C} x2={C + R} y2={C + 60} stroke="#b46bff" strokeWidth="2" markerEnd="url(#od-a-purple)" />
        {/* resulting acceleration */}
        <line x1={C + R} y1={C} x2={C + R - 70} y2={C + 60} stroke="#ff0099" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#od-a-pink)" />
        <circle cx={C + R} cy={C} r="7" fill="#fff" />
        <circle cx={C + R} cy={C} r="16" fill="none" stroke="#fff" strokeOpacity="0.3">
          <animate attributeName="r" values="10;22;10" dur="2s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* legend */}
      <g fontFamily="var(--font-geist-mono)" fontSize="11" letterSpacing="2">
        <g transform="translate(24 470)">
          <line x1="0" y1="0" x2="22" y2="0" stroke="#00f3ff" strokeWidth="2" />
          <text x="30" y="4" fill="#ffffff" fillOpacity="0.6">PULL û</text>
        </g>
        <g transform="translate(160 470)">
          <line x1="0" y1="0" x2="22" y2="0" stroke="#b46bff" strokeWidth="2" />
          <text x="30" y="4" fill="#ffffff" fillOpacity="0.6">SWIRL τ̂</text>
        </g>
        <g transform="translate(310 470)">
          <line x1="0" y1="0" x2="22" y2="0" stroke="#ff0099" strokeWidth="2" strokeDasharray="4 4" />
          <text x="30" y="4" fill="#ffffff" fillOpacity="0.6">NET FORCE</text>
        </g>
      </g>
    </svg>
  );
}
