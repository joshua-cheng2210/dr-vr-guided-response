const pad = (n: number) => String(n).padStart(2, '0');

/** Wall-clock time, 24-hour: "14:02:10". */
export function clock(ms: number): string {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Duration as "m:ss". */
export function duration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${pad(total % 60)}`;
}
