import type { LogEntry } from '../engine/engine';
import { clock, duration } from '../format';

export function formatLog(log: LogEntry[], startedAt: number): string {
  return log.map((e) => `${clock(e.at)}  +${duration(e.at - startedAt)}  ${e.text}`).join('\n');
}

export function HandoffLog({ log, startedAt }: { log: LogEntry[]; startedAt: number }) {
  return (
    <section className="handoff" aria-label="EMS handoff log">
      <h2>EMS handoff</h2>
      <table>
        <tbody>
          {log.map((entry, i) => (
            <tr key={i}>
              <td className="handoff-time">{clock(entry.at)}</td>
              <td className="handoff-elapsed">+{duration(entry.at - startedAt)}</td>
              <td>{entry.text}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="handoff-note">Scene events only. No patient name or history.</p>
    </section>
  );
}
