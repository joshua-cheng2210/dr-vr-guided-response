export type Command = 'start' | 'yes' | 'no' | 'next' | 'back' | 'repeat' | 'dose';

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Maps a spoken phrase to a command. Order matters: the more specific phrases are checked first,
 * and a phrase containing both "yes" and "no" is ignored rather than guessed.
 */
export function parseCommand(transcript: string): Command | null {
  const t = normalize(transcript);
  if (!t) return null;

  if (/\b(dose|doses|those) (is )?(given|done)\b/.test(t) || /\bgave (the|a|it)\b/.test(t) || t === 'given') {
    return 'dose';
  }
  if (/\b(repeat|again|pardon)\b/.test(t)) return 'repeat';
  if (/\b(back|previous)\b/.test(t)) return 'back';

  const yes = /\b(yes|yeah|yep|yup|yah)\b/.test(t);
  const no = /\b(no|nope|nah)\b/.test(t);
  if (yes && no) return null;
  if (yes) return 'yes';
  if (no) return 'no';

  if (/\b(next|continue|done|ready|got it)\b/.test(t)) return 'next';
  if (/\b(help|start|emergency)\b/.test(t)) return 'start';
  return null;
}

/** True when the microphone probably heard the app's own voice through the speakers. */
export function isLikelyEcho(transcript: string, spoken: string): boolean {
  const t = normalize(transcript);
  // Pad with spaces so only whole words match: "no" must not match inside "normally".
  return t.length > 0 && ` ${normalize(spoken)} `.includes(` ${t} `);
}
