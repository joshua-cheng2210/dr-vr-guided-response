import type { ReactNode } from 'react';
import type { IllustrationKey } from '../engine/types';

// Simple line drawings standing in for the headset's AR overlays.

const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Ground() {
  return <line x1="12" y1="138" x2="188" y2="138" stroke="currentColor" strokeWidth="3" opacity="0.3" />;
}

function PersonOnBack() {
  return (
    <g {...line}>
      <circle cx="38" cy="114" r="13" />
      <line x1="53" y1="118" x2="122" y2="118" strokeWidth="13" />
      <line x1="122" y1="118" x2="178" y2="122" strokeWidth="9" />
      <line x1="72" y1="120" x2="106" y2="130" />
    </g>
  );
}

function Spray({ x, y }: { x: number; y: number }) {
  return (
    <g {...line} strokeWidth={4}>
      <rect x={x - 8} y={y} width="16" height="34" rx="6" />
      <rect x={x - 22} y={y + 34} width="44" height="58" rx="10" />
      <rect x={x - 16} y={y + 92} width="32" height="12" rx="4" fill="currentColor" />
    </g>
  );
}

const drawings: Record<IllustrationKey, { label: string; art: ReactNode }> = {
  shout: {
    label: 'Shout and shake their shoulders',
    art: (
      <>
        <Ground />
        <PersonOnBack />
        <circle cx="66" cy="94" r="8" className="accent-fill" />
        <g {...line} strokeWidth={4} className="accent">
          <path d="M54 82 l-6 -8 M66 78 v-11 M78 82 l6 -8" />
          <path d="M22 92 q-8 -10 0 -22 M12 98 q-14 -18 0 -36" />
        </g>
      </>
    ),
  },
  breathing: {
    label: 'Watch their chest rise and fall',
    art: (
      <>
        <Ground />
        <PersonOnBack />
        <path d="M60 92 q9 -14 18 0 t18 0 t18 0" {...line} strokeWidth={4} className="accent" />
        <text x="134" y="92" fontSize="30" fontWeight="800" fill="currentColor" className="accent-fill">?</text>
      </>
    ),
  },
  pupils: {
    label: 'An eye with a pinpoint pupil',
    art: (
      <>
        <path d="M18 80 Q100 8 182 80 Q100 152 18 80 Z" {...line} />
        <circle cx="100" cy="80" r="30" {...line} strokeWidth={4} />
        <circle cx="100" cy="80" r="4" className="accent-fill" />
        <path d="M150 30 l-34 38" {...line} strokeWidth={3} className="accent" />
      </>
    ),
  },
  lips: {
    label: 'Lips with a blue-gray tint',
    art: (
      <>
        <path d="M36 80 Q68 48 100 68 Q132 48 164 80 Q100 94 36 80 Z" fill="#7d96b3" stroke="currentColor" strokeWidth="4" />
        <path d="M36 80 Q100 94 164 80 Q132 124 100 122 Q68 124 36 80 Z" fill="#647e9c" stroke="currentColor" strokeWidth="4" />
      </>
    ),
  },
  naloxone: {
    label: 'Naloxone nasal spray',
    art: (
      <>
        <Spray x={100} y={14} />
        <text x="100" y="146" textAnchor="middle" fontSize="14" fontWeight="700" letterSpacing="3" fill="currentColor">
          NALOXONE
        </text>
      </>
    ),
  },
  phone: {
    label: 'Phone calling 911 on speaker',
    art: (
      <>
        <rect x="64" y="14" width="72" height="132" rx="12" {...line} />
        <line x1="90" y1="28" x2="110" y2="28" {...line} strokeWidth={4} />
        <text x="100" y="92" textAnchor="middle" fontSize="30" fontWeight="800" fill="currentColor" className="accent-fill">
          911
        </text>
        <path d="M148 58 q12 22 0 44 M162 46 q22 34 0 68" {...line} strokeWidth={4} className="accent" />
      </>
    ),
  },
  'lay-back': {
    label: 'Person lying flat on their back',
    art: (
      <>
        <Ground />
        <PersonOnBack />
        <path d="M88 36 v40 M74 62 l14 14 l14 -14" {...line} strokeWidth={5} className="accent" />
      </>
    ),
  },
  'hold-spray': {
    label: 'Thumb on the plunger, two fingers beside the nozzle',
    art: (
      <>
        <Spray x={100} y={14} />
        <ellipse cx="72" cy="46" rx="9" ry="15" className="accent-fill" opacity="0.85" />
        <ellipse cx="128" cy="46" rx="9" ry="15" className="accent-fill" opacity="0.85" />
        <ellipse cx="100" cy="136" rx="18" ry="10" className="accent-fill" opacity="0.85" />
      </>
    ),
  },
  insert: {
    label: 'Head tilted back with the nozzle in one nostril',
    art: (
      <>
        <circle cx="76" cy="70" r="40" {...line} />
        <path d="M114 58 L134 78 L112 86" {...line} />
        <path d="M44 124 q34 22 68 0" {...line} strokeWidth={5} className="accent" />
        <g transform="translate(126 84) rotate(-18) scale(0.55)">
          <Spray x={0} y={0} />
        </g>
        <path d="M168 120 v-26 M158 104 l10 -10 l10 10" {...line} strokeWidth={4} className="accent" />
      </>
    ),
  },
  press: {
    label: 'Press the plunger firmly',
    art: (
      <>
        <Spray x={100} y={10} />
        <path d="M100 156 v-30 M86 140 l14 -14 l14 14" {...line} strokeWidth={6} className="accent" />
      </>
    ),
  },
  recovery: {
    label: 'Person on their side in the recovery position',
    art: (
      <>
        <Ground />
        <g {...line}>
          <circle cx="40" cy="108" r="13" />
          <line x1="55" y1="114" x2="118" y2="118" strokeWidth="13" />
          <polyline points="118,118 144,98 160,128" strokeWidth="9" />
          <line x1="118" y1="122" x2="180" y2="128" strokeWidth="9" />
          <polyline points="70,120 62,134 84,134" />
        </g>
        <path d="M30 70 a30 30 0 0 1 40 -6" {...line} strokeWidth={4} className="accent" />
        <path d="M70 64 l-2 -12 M70 64 l-12 2" {...line} strokeWidth={4} className="accent" />
      </>
    ),
  },
  'second-dose': {
    label: 'Second dose',
    art: (
      <>
        <circle cx="100" cy="80" r="58" {...line} />
        <text x="100" y="104" textAnchor="middle" fontSize="70" fontWeight="800" fill="currentColor">
          2
        </text>
      </>
    ),
  },
  ok: {
    label: 'They are responding',
    art: (
      <>
        <circle cx="100" cy="80" r="58" {...line} />
        <path d="M72 82 l20 20 l38 -42" {...line} strokeWidth={8} />
      </>
    ),
  },
};

export function Illustration({ kind }: { kind: IllustrationKey }) {
  const { label, art } = drawings[kind];
  return (
    <svg viewBox="0 0 200 160" className="illustration" role="img" aria-label={label}>
      {art}
    </svg>
  );
}
