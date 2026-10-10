// A protocol is pure data: the engine knows these step kinds and nothing about naloxone.

export type Answer = 'yes' | 'no';

export type IllustrationKey =
  | 'shout'
  | 'breathing'
  | 'pupils'
  | 'lips'
  | 'naloxone'
  | 'phone'
  | 'lay-back'
  | 'hold-spray'
  | 'insert'
  | 'press'
  | 'recovery'
  | 'second-dose'
  | 'ok';

/** Every listed condition must hold for a variant to apply. */
export interface Condition {
  /** At least one of these question ids was answered "yes". */
  anyYes?: string[];
  /** At least this many doses have been given. */
  dosesAtLeast?: number;
}

/** Overrides a step's wording when its condition matches. First match wins. */
export interface Variant {
  when: Condition;
  title?: string;
  text?: string;
  speak?: string;
}

interface StepBase {
  id: string;
  title: string;
  /** Shown on screen. */
  text: string;
  /** Read aloud. Defaults to `text`. Must not contain voice-command words (see commands.ts). */
  speak?: string;
  /** Short label shown above the title, e.g. "Triage". */
  phase?: string;
  illustration?: IllustrationKey;
  /** Kit bay to highlight instead of an illustration. */
  bay?: number;
  tone?: 'normal' | 'alert' | 'success';
  variants?: Variant[];
}

/** An instruction. Moves on with "next". `next` defaults to the following step. */
export interface InfoStep extends StepBase {
  kind: 'info';
  next?: string;
}

/** A yes/no question. Branches default to the following step. */
export interface QuestionStep extends StepBase {
  kind: 'question';
  /** Label for the handoff log, e.g. "Pinpoint pupils" → "Pinpoint pupils: yes". */
  log: string;
  onYes?: string;
  onNo?: string;
  /**
   * The answer to highlight, when published guidance favours one (e.g. "use naloxone?").
   * Leave unset otherwise: Yes and No then look the same, so color never hints at an answer.
   */
  recommended?: Answer;
}

/** Waits for "dose given", counts the dose, then moves on. */
export interface DoseStep extends StepBase {
  kind: 'dose';
  next?: string;
}

/** A countdown that moves on by itself. */
export interface WaitStep extends StepBase {
  kind: 'wait';
  seconds: number;
  /** Used instead of `seconds` when the app runs with ?demo=1. */
  demoSeconds?: number;
  next?: string;
}

/** A yes/no question where silence counts as "no" after `silenceSeconds`. */
export interface CheckinStep extends StepBase {
  kind: 'checkin';
  log: string;
  silenceSeconds: number;
  demoSilenceSeconds?: number;
  onYes: string;
  onNo: string;
  /** Where "no" goes once `maxDoses` have been given. */
  onNoDosesLeft: string;
}

/** Terminal step. The app shows the handoff log here. */
export interface EndStep extends StepBase {
  kind: 'end';
}

export type Step = InfoStep | QuestionStep | DoseStep | WaitStep | CheckinStep | EndStep;

export interface Protocol {
  id: string;
  title: string;
  maxDoses: number;
  sources: string[];
  steps: Step[];
}
