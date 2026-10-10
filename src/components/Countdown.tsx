import { duration } from '../format';

const R = 52;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function Countdown({ endsAt, totalMs, now }: { endsAt: number; totalMs: number; now: number }) {
  const remaining = Math.max(0, endsAt - now);
  const fraction = totalMs > 0 ? remaining / totalMs : 0;
  return (
    <div className="countdown" role="timer" aria-label={`${duration(remaining + 999)} until check-in`}>
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={R} className="ring-track" />
        <circle
          cx="60"
          cy="60"
          r={R}
          className="ring"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="countdown-label">
        <span className="countdown-time">{duration(remaining + 999)}</span>
        <span className="countdown-caption">until check-in</span>
      </div>
    </div>
  );
}

/** Thin bar for the check-in: when it empties, silence counts as "no". */
export function SilenceBar({ endsAt, totalMs, now }: { endsAt: number; totalMs: number; now: number }) {
  const remaining = Math.max(0, endsAt - now);
  return (
    <div className="silence">
      <div className="silence-track">
        <div className="silence-fill" style={{ width: `${(remaining / totalMs) * 100}%` }} />
      </div>
      <span>No answer in {Math.ceil(remaining / 1000)}s counts as “no”</span>
    </div>
  );
}
