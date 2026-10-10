import { describe, expect, it } from 'vitest';
import naloxoneJson from '../protocols/naloxone.json';
import { createReducer, getStep, initialState, resolveStep, type EngineEvent, type EngineState } from './engine';
import { validateProtocol } from './validate';
import type { Protocol } from './types';
import { parseCommand } from '../speech/commands';

const protocol = validateProtocol(naloxoneJson as unknown as Protocol);
const T0 = 1_000_000;

const start: EngineEvent = { type: 'START', now: T0 };
const yes = (now = T0): EngineEvent => ({ type: 'ANSWER', answer: 'yes', now });
const no = (now = T0): EngineEvent => ({ type: 'ANSWER', answer: 'no', now });
const next = (now = T0): EngineEvent => ({ type: 'NEXT', now });
const back = (now = T0): EngineEvent => ({ type: 'BACK', now });
const dose = (now = T0): EngineEvent => ({ type: 'DOSE_GIVEN', now });
const tick = (now: number): EngineEvent => ({ type: 'TICK', now });

function run(events: EngineEvent[], demo = false, from: EngineState = initialState()): EngineState {
  return events.reduce(createReducer(protocol, { demo }), from);
}

function view(state: EngineState) {
  return resolveStep(getStep(protocol, state.stepId!), state);
}

// Unresponsive, abnormal breathing, pinpoint pupils → naloxone → first dose.
const toFirstDose: EngineEvent[] = [
  start, no(), yes(), yes(), no(), // triage
  yes(), // use naloxone
  next(), next(), next(), next(), next(), // call 911, kit, lay back, prepare, insert
  dose(),
];

describe('triage', () => {
  it('ends early when the person responds', () => {
    const s = run([start, yes()]);
    expect(s.status).toBe('done');
    expect(s.stepId).toBe('end-responsive');
  });

  it('ends early when they are unresponsive but breathing normally', () => {
    const s = run([start, no(), no()]);
    expect(s.stepId).toBe('end-breathing');
  });

  it('says "looks like an opioid overdose" when pupils or lips match', () => {
    const s = run([start, no(), yes(), yes(), no()]);
    expect(s.stepId).toBe('result');
    expect(view(s).title).toBe('This looks like a possible opioid overdose');
  });

  it('still offers naloxone, more cautiously, without those signs', () => {
    const s = run([start, no(), yes(), no(), no()]);
    expect(view(s).title).toBe('An overdose is possible');
  });

  it('sends a "no" to naloxone to the 911 ending', () => {
    const s = run([start, no(), yes(), yes(), no(), no()]);
    expect(s.stepId).toBe('end-no-naloxone');
  });
});

describe('dosing and the check-in timer', () => {
  it('counts the dose and starts the 2:30 recovery timer', () => {
    const s = run(toFirstDose);
    expect(s.stepId).toBe('recovery');
    expect(s.doses).toBe(1);
    expect(s.timerEndsAt).toBe(T0 + 150_000);
  });

  it('uses the short timer in demo mode', () => {
    expect(run(toFirstDose, true).timerEndsAt).toBe(T0 + 15_000);
  });

  it('does nothing before the timer runs out', () => {
    expect(run([...toFirstDose, tick(T0 + 149_999)]).stepId).toBe('recovery');
  });

  it('can skip the wait in a demo, starting the check-in clock from the skip time', () => {
    const s = run([...toFirstDose, { type: 'SKIP_WAIT', now: T0 + 3_000 }], true);
    expect(s.stepId).toBe('checkin');
    expect(s.timerEndsAt).toBe(T0 + 3_000 + 10_000);
  });

  it('ignores a skip outside a wait step', () => {
    expect(run([start, { type: 'SKIP_WAIT', now: T0 }]).stepId).toBe('q-responds');
  });

  it('moves to the check-in when the timer runs out', () => {
    const s = run([...toFirstDose, tick(T0 + 150_000)]);
    expect(s.stepId).toBe('checkin');
    expect(s.timerEndsAt).toBe(T0 + 150_000 + 15_000);
  });

  it('ends well when the check-in answer is yes', () => {
    const s = run([...toFirstDose, tick(T0 + 150_000), yes(T0 + 152_000)]);
    expect(s.stepId).toBe('end-recovering');
    expect(s.status).toBe('done');
  });

  it('treats silence at the check-in as "not responding"', () => {
    const s = run([...toFirstDose, tick(T0 + 150_000), tick(T0 + 165_000)]);
    expect(s.stepId).toBe('second-dose');
    expect(s.log.at(-1)?.text).toBe('Check-in: no answer, counted as not responding');
  });

  it('switches to the other nostril for the second dose, then runs out', () => {
    let s = run([...toFirstDose, tick(T0 + 150_000), no(T0 + 152_000), next(T0 + 153_000)]);
    expect(s.stepId).toBe('prepare');
    expect(view(s).title).toBe('Get a new spray ready');

    s = run([next(T0 + 154_000)], false, s);
    expect(s.stepId).toBe('insert');
    expect(view(s).text).toContain('other nostril');

    s = run([dose(T0 + 155_000)], false, s);
    expect(s.stepId).toBe('insert'); // "dose given" only counts on the dose step

    s = run([next(T0 + 155_000), dose(T0 + 156_000)], false, s);
    expect(s.doses).toBe(2);
    expect(s.timerEndsAt).toBe(T0 + 156_000 + 150_000);

    s = run([tick(T0 + 306_000), no(T0 + 307_000)], false, s);
    expect(s.stepId).toBe('end-no-doses');
    expect(s.status).toBe('done');
  });
});

describe('back', () => {
  it('returns to the previous triage question', () => {
    expect(run([start, no(), back()]).stepId).toBe('q-responds');
  });

  it('is ignored while a timer is running', () => {
    expect(run([...toFirstDose, back()]).stepId).toBe('recovery');
  });

  it('cannot step back past a dose', () => {
    const s = run([...toFirstDose, tick(T0 + 150_000), no(), back()]);
    expect(s.stepId).toBe('second-dose');
  });
});

describe('handoff log', () => {
  it('records the scene in order with timestamps', () => {
    const s = run([
      start,
      no(T0 + 5_000), yes(T0 + 10_000), yes(T0 + 15_000), no(T0 + 20_000),
      yes(T0 + 25_000), next(), next(), next(), next(), next(),
      dose(T0 + 60_000), tick(T0 + 210_000), yes(T0 + 212_000),
    ]);
    expect(s.log.map((e) => e.text)).toEqual([
      'Started: Opioid overdose · Naloxone',
      'Responds to voice or touch: no',
      'Breathing slow, gasping or stopped: yes',
      'Pinpoint pupils: yes',
      'Blue or gray lips or fingertips: no',
      'Use naloxone: yes',
      'Dose 1 given',
      'Check-in: responding',
      "Ended: They're responding",
    ]);
    expect(s.log.find((e) => e.text === 'Dose 1 given')?.at).toBe(T0 + 60_000);
  });
});

describe('protocol file', () => {
  it('rejects a branch that points at a missing step', () => {
    const broken = structuredClone(protocol);
    (broken.steps[0] as { onYes?: string }).onYes = 'does-not-exist';
    expect(() => validateProtocol(broken)).toThrow(/unknown step "does-not-exist"/);
  });

  it('rejects a recommended answer that is not yes or no', () => {
    const broken = structuredClone(protocol);
    (broken.steps[0] as { recommended?: string }).recommended = 'Yes';
    expect(() => validateProtocol(broken)).toThrow(/recommended must be "yes" or "no"/);
  });

  // The mic can hear the speakers. If a spoken line contained "back" or "yes",
  // the app could answer its own question, so no spoken line may parse as a command.
  it('never speaks a line that would trigger a voice command', () => {
    const spoken = protocol.steps.flatMap((step) => [
      step.speak ?? step.text,
      ...(step.variants ?? []).map((v) => v.speak ?? v.text ?? step.speak ?? step.text),
    ]);
    const triggers = spoken.filter((line) => parseCommand(line) !== null);
    expect(triggers).toEqual([]);
  });
});
