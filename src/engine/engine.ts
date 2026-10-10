import type { Answer, CheckinStep, Condition, Protocol, Step } from './types';

export interface LogEntry {
  at: number;
  text: string;
}

export interface EngineState {
  status: 'idle' | 'running' | 'done';
  stepId: string | null;
  /** Increments on every step entry, so the UI knows when to speak. */
  visit: number;
  /** Step ids to return to with "back". Cleared after a dose: a dose can't be undone. */
  history: string[];
  answers: Record<string, Answer>;
  doses: number;
  startedAt: number | null;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  log: LogEntry[];
}

// Every event carries `now`, so the reducer never reads the clock and tests can jump in time.
export type EngineEvent =
  | { type: 'START'; now: number }
  | { type: 'ANSWER'; answer: Answer; now: number }
  | { type: 'NEXT'; now: number }
  | { type: 'BACK'; now: number }
  | { type: 'DOSE_GIVEN'; now: number }
  | { type: 'TICK'; now: number }
  /** Demo-only shortcut: end a wait step now. */
  | { type: 'SKIP_WAIT'; now: number }
  | { type: 'RESET' };

export interface EngineOptions {
  /** Use the protocol's short demo timings. */
  demo: boolean;
}

export interface StepView {
  title: string;
  text: string;
  speak: string;
}

export function initialState(): EngineState {
  return {
    status: 'idle',
    stepId: null,
    visit: 0,
    history: [],
    answers: {},
    doses: 0,
    startedAt: null,
    timerEndsAt: null,
    timerTotalMs: null,
    log: [],
  };
}

export function getStep(protocol: Protocol, id: string): Step {
  const step = protocol.steps.find((s) => s.id === id);
  if (!step) throw new Error(`Unknown step "${id}" in protocol "${protocol.id}"`);
  return step;
}

function nextInOrder(protocol: Protocol, id: string): string {
  const i = protocol.steps.findIndex((s) => s.id === id);
  const following = protocol.steps[i + 1];
  if (!following) throw new Error(`Step "${id}" has no following step`);
  return following.id;
}

function matches(cond: Condition, state: EngineState): boolean {
  if (cond.anyYes && !cond.anyYes.some((id) => state.answers[id] === 'yes')) return false;
  if (cond.dosesAtLeast !== undefined && state.doses < cond.dosesAtLeast) return false;
  return true;
}

/** The wording to show and speak for a step, after applying any matching variant. */
export function resolveStep(step: Step, state: EngineState): StepView {
  const v = step.variants?.find((variant) => matches(variant.when, state));
  if (!v) return { title: step.title, text: step.text, speak: step.speak ?? step.text };
  const text = v.text ?? step.text;
  const speak = v.speak ?? (v.text !== undefined ? v.text : (step.speak ?? step.text));
  return { title: v.title ?? step.title, text, speak };
}

function addLog(state: EngineState, at: number, text: string): EngineState {
  return { ...state, log: [...state.log, { at, text }] };
}

function durationMs(seconds: number, demoSeconds: number | undefined, opts: EngineOptions): number {
  return (opts.demo && demoSeconds !== undefined ? demoSeconds : seconds) * 1000;
}

export function createReducer(protocol: Protocol, opts: EngineOptions) {
  function enter(state: EngineState, stepId: string, now: number, pushHistory: boolean): EngineState {
    const step = getStep(protocol, stepId);
    let timerTotalMs: number | null = null;
    if (step.kind === 'wait') timerTotalMs = durationMs(step.seconds, step.demoSeconds, opts);
    if (step.kind === 'checkin') timerTotalMs = durationMs(step.silenceSeconds, step.demoSilenceSeconds, opts);

    const entered: EngineState = {
      ...state,
      stepId,
      visit: state.visit + 1,
      history: pushHistory && state.stepId ? [...state.history, state.stepId] : state.history,
      timerEndsAt: timerTotalMs === null ? null : now + timerTotalMs,
      timerTotalMs,
    };
    if (step.kind !== 'end') return entered;
    return addLog({ ...entered, status: 'done' }, now, `Ended: ${resolveStep(step, entered).title}`);
  }

  function answerCheckin(step: CheckinStep, state: EngineState, answer: Answer, now: number, silent: boolean) {
    const outcome =
      answer === 'yes' ? 'responding' : silent ? 'no answer, counted as not responding' : 'not responding';
    const logged = addLog(state, now, `${step.log}: ${outcome}`);
    if (answer === 'yes') return enter(logged, step.onYes, now, false);
    const target = logged.doses >= protocol.maxDoses ? step.onNoDosesLeft : step.onNo;
    return enter(logged, target, now, false);
  }

  return function reduce(state: EngineState, event: EngineEvent): EngineState {
    if (event.type === 'RESET') return initialState();
    if (event.type === 'START') {
      if (state.status !== 'idle') return state;
      const started = addLog(
        { ...initialState(), status: 'running', startedAt: event.now },
        event.now,
        `Started: ${protocol.title}`,
      );
      return enter(started, protocol.steps[0].id, event.now, false);
    }
    if (state.status !== 'running' || state.stepId === null) return state;

    const step = getStep(protocol, state.stepId);
    switch (event.type) {
      case 'ANSWER': {
        if (step.kind === 'checkin') return answerCheckin(step, state, event.answer, event.now, false);
        if (step.kind !== 'question') return state;
        const answered = addLog(
          { ...state, answers: { ...state.answers, [step.id]: event.answer } },
          event.now,
          `${step.log}: ${event.answer}`,
        );
        const target = (event.answer === 'yes' ? step.onYes : step.onNo) ?? nextInOrder(protocol, step.id);
        return enter(answered, target, event.now, true);
      }
      case 'NEXT':
        if (step.kind !== 'info') return state;
        return enter(state, step.next ?? nextInOrder(protocol, step.id), event.now, true);
      case 'BACK': {
        // Timers keep running in the real world, so there's no going back from them.
        if (step.kind === 'wait' || step.kind === 'checkin') return state;
        const previous = state.history[state.history.length - 1];
        if (previous === undefined) return state;
        return { ...enter(state, previous, event.now, false), history: state.history.slice(0, -1) };
      }
      case 'DOSE_GIVEN': {
        if (step.kind !== 'dose') return state;
        const doses = state.doses + 1;
        const dosed = addLog({ ...state, doses, history: [] }, event.now, `Dose ${doses} given`);
        return enter(dosed, step.next ?? nextInOrder(protocol, step.id), event.now, false);
      }
      case 'TICK': {
        if (state.timerEndsAt === null || event.now < state.timerEndsAt) return state;
        if (step.kind === 'wait') return enter(state, step.next ?? nextInOrder(protocol, step.id), event.now, false);
        if (step.kind === 'checkin') return answerCheckin(step, state, 'no', event.now, true);
        return state;
      }
      case 'SKIP_WAIT':
        if (step.kind !== 'wait') return state;
        return enter(state, step.next ?? nextInOrder(protocol, step.id), event.now, false);
      default:
        return state;
    }
  };
}
