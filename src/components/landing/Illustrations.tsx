/** Inline SVG art for the landing page. Decorative only, so every svg is aria-hidden. */

const INK = "#14171a";
const AMBER = "#ffd60a";
const GREEN = "#0b5d3b";

type Props = { className?: string };

export function PinArt({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 160 100" aria-hidden="true" focusable="false">
      <rect x="6" y="8" width="148" height="84" rx="14" fill="#fff" stroke={INK} strokeWidth="3" />
      <path d="M20 78 C50 78 40 40 74 44 S120 70 140 28" fill="none" stroke={INK} strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />
      <circle cx="22" cy="78" r="9" fill={INK} />
      <text x="22" y="82" textAnchor="middle" fontSize="11" fontWeight="800" fill={AMBER} fontFamily="system-ui, sans-serif">M</text>
      <path d="M128 52 C116 38 118 22 134 22 C150 22 152 38 140 52 L134 62 Z" fill={AMBER} stroke={INK} strokeWidth="3" strokeLinejoin="round" transform="translate(-6 -8)" />
      <circle cx="128" cy="30" r="5" fill={INK} />
    </svg>
  );
}

export function MatchArt({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 160 100" aria-hidden="true" focusable="false">
      <rect x="6" y="8" width="148" height="84" rx="14" fill="#fff" stroke={INK} strokeWidth="3" />
      <circle cx="26" cy="50" r="11" fill={INK} />
      <text x="26" y="54" textAnchor="middle" fontSize="12" fontWeight="800" fill={AMBER} fontFamily="system-ui, sans-serif">M</text>
      <path d="M38 50 H66" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M66 50 C84 50 86 26 104 26 M66 50 H104 M66 50 C84 50 86 74 104 74" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      {[26, 50, 74].map((y) => (
        <g key={y}>
          <circle cx="118" cy={y - 5} r="4.5" fill={AMBER} stroke={INK} strokeWidth="2.5" />
          <path d={`M109 ${y + 7} C109 ${y} 127 ${y} 127 ${y + 7} Z`} fill={AMBER} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
        </g>
      ))}
    </svg>
  );
}

export function RideArt({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 160 100" aria-hidden="true" focusable="false">
      <rect x="6" y="8" width="148" height="84" rx="14" fill="#fff" stroke={INK} strokeWidth="3" />
      <path d="M14 80 H146" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeDasharray="10 8" />
      <path d="M30 70 V46 C30 36 38 30 50 30 H78 C92 30 98 40 104 52 L112 52 C118 52 120 56 120 62 V70 Z" fill={AMBER} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M40 46 H70 V58 H40 Z" fill="#fff" stroke={INK} strokeWidth="2.5" />
      <circle cx="46" cy="72" r="9" fill={INK} />
      <circle cx="46" cy="72" r="3" fill={AMBER} />
      <circle cx="106" cy="72" r="9" fill={INK} />
      <circle cx="106" cy="72" r="3" fill={AMBER} />
      <circle cx="128" cy="28" r="15" fill={GREEN} stroke={INK} strokeWidth="3" />
      <text x="128" y="34" textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff" fontFamily="system-ui, sans-serif">₹</text>
    </svg>
  );
}

export function Mark({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <circle cx="36" cy="50" r="24" fill="none" stroke={INK} strokeWidth="11" />
      <circle cx="64" cy="50" r="24" fill="none" stroke={INK} strokeWidth="11" />
      <circle cx="50" cy="50" r="6" fill={INK} />
    </svg>
  );
}

export function CheckArt({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="21" fill={GREEN} stroke={INK} strokeWidth="3" />
      <path d="M14 25 L21 32 L34 17" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
