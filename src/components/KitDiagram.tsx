import { BAYS } from '../kit';

const COLS = 3;
const GAP = 8;
const X0 = 24;
const Y0 = 42;
const WIDTH = 272;
const HEIGHT = 152;
const BAY_W = (WIDTH - GAP * (COLS - 1)) / COLS;
const BAY_H = (HEIGHT - GAP) / 2;

/** Top-down view of the open Pelican case, with the target bay pulsing. */
export function KitDiagram({ highlight }: { highlight: number }) {
  const target = BAYS.find((b) => b.number === highlight);
  return (
    <figure className="kit">
      <svg viewBox="0 0 320 210" role="img" aria-label={`Kit layout with bay ${highlight} highlighted`}>
        <rect x="112" y="4" width="96" height="24" rx="10" className="kit-handle" />
        <rect x="8" y="24" width="304" height="182" rx="18" className="kit-case" />
        {BAYS.map((bay, i) => {
          const x = X0 + (i % COLS) * (BAY_W + GAP);
          const y = Y0 + Math.floor(i / COLS) * (BAY_H + GAP);
          const active = bay.number === highlight;
          return (
            <g key={bay.number} className={active ? 'bay bay-active' : 'bay bay-dim'}>
              <rect x={x} y={y} width={BAY_W} height={BAY_H} rx="8" fill={bay.color} className="bay-rect" />
              <text x={x + 10} y={y + 28} className="bay-number">
                {bay.number}
              </text>
              <text x={x + 10} y={y + BAY_H - 10} className="bay-name">
                {bay.short ?? bay.name}
              </text>
              {active && <rect x={x + BAY_W - 30} y={y + 8} width="20" height="34" rx="4" className="bay-slot" />}
            </g>
          );
        })}
      </svg>
      {target && (
        <figcaption>
          Bay {target.number} · {target.name}. Narcan is in the top-right slot.
        </figcaption>
      )}
    </figure>
  );
}
