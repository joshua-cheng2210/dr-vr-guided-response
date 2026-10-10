import { describe, expect, it } from 'vitest';
import { isLikelyEcho, parseCommand } from './commands';

describe('parseCommand', () => {
  it.each([
    ['yes', 'yes'],
    ['Yeah.', 'yes'],
    ['no', 'no'],
    ['Nope', 'no'],
    ['next please', 'next'],
    ['okay got it', 'next'],
    ['go back', 'back'],
    ['can you repeat that', 'repeat'],
    ['say that again', 'repeat'],
    ['dose given', 'dose'],
    ['the dose is given', 'dose'],
    ['I gave it', 'dose'],
    ['help', 'start'],
  ] as const)('"%s" → %s', (said, command) => {
    expect(parseCommand(said)).toBe(command);
  });

  it.each(['yes no', "what's happening", '', 'nose', 'I know'])('ignores "%s"', (said) => {
    expect(parseCommand(said)).toBeNull();
  });
});

describe('isLikelyEcho', () => {
  it('flags a fragment of what the app just said', () => {
    expect(isLikelyEcho('on their back', 'Lay them on their back.')).toBe(true);
  });

  it('lets a real command through', () => {
    expect(isLikelyEcho('next', 'Lay them flat, face up.')).toBe(false);
  });

  // "no" is inside "normally" and "yes" is inside "eyes": match whole words, not letters.
  it('does not mistake a word for an echo of a longer word', () => {
    expect(isLikelyEcho('no', 'Are they waking up or breathing normally?')).toBe(false);
    expect(isLikelyEcho('yes', 'Look at their eyes.')).toBe(false);
  });
});
