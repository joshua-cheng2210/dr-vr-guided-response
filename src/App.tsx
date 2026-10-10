import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import naloxoneJson from './protocols/naloxone.json';
import { createReducer, getStep, initialState, resolveStep } from './engine/engine';
import { validateProtocol } from './engine/validate';
import type { Answer, Protocol } from './engine/types';
import type { Command } from './speech/commands';
import { useSpeech, type Speech } from './speech/useSpeech';
import { Illustration } from './components/Illustration';
import { KitDiagram } from './components/KitDiagram';
import { Countdown, SilenceBar } from './components/Countdown';
import { HandoffLog, formatLog } from './components/HandoffLog';
import { duration } from './format';

const protocol = validateProtocol(naloxoneJson as unknown as Protocol);
/** ?demo=1 shortens the waits so a live demo doesn't stall (demo.md §5). */
const demo = new URLSearchParams(window.location.search).get('demo') === '1';

const KEYS: Record<string, Command> = {
  y: 'yes',
  n: 'no',
  d: 'dose',
  r: 'repeat',
  ArrowRight: 'next',
  ArrowLeft: 'back',
};

export default function App() {
  const reduce = useMemo(() => createReducer(protocol, { demo }), []);
  const [state, dispatch] = useReducer(reduce, undefined, initialState);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  const step = state.stepId ? getStep(protocol, state.stepId) : null;
  const view = step ? resolveStep(step, state) : null;
  const speech = useSpeech(handleCommand);

  function start() {
    if (speech.supported) speech.listen();
    dispatch({ type: 'START', now: Date.now() });
  }

  function answer(value: Answer) {
    dispatch({ type: 'ANSWER', answer: value, now: Date.now() });
  }

  function repeat() {
    if (view) speech.say(view.speak);
  }

  function restart() {
    setCopied(false);
    dispatch({ type: 'RESET' });
  }

  async function copyLog() {
    if (state.startedAt === null) return;
    try {
      await navigator.clipboard.writeText(formatLog(state.log, state.startedAt));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function handleCommand(command: Command) {
    const t = Date.now();
    switch (command) {
      case 'start':
        if (state.status === 'idle') start();
        return;
      case 'yes':
      case 'no':
        answer(command);
        return;
      case 'next':
        dispatch({ type: 'NEXT', now: t });
        return;
      case 'back':
        dispatch({ type: 'BACK', now: t });
        return;
      case 'dose':
        dispatch({ type: 'DOSE_GIVEN', now: t });
        return;
      case 'repeat':
        repeat();
        return;
    }
  }

  const handleCommandRef = useRef(handleCommand);
  handleCommandRef.current = handleCommand;

  // Speak each step as it appears.
  useEffect(() => {
    if (view) speech.say(view.speak);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.visit]);

  // Drive the timers and the elapsed clock.
  useEffect(() => {
    if (state.status !== 'running') return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      dispatch({ type: 'TICK', now: t });
    }, 250);
    return () => window.clearInterval(id);
  }, [state.status]);

  // Keyboard shortcuts, so the presenter has a third way in besides voice and taps.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const command = KEYS[e.key];
      if (!command) return;
      e.preventDefault();
      handleCommandRef.current(command);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function controls() {
    if (state.status === 'idle' || !step) return null;
    const canGoBack = state.history.length > 0;
    const backButton = (
      <button className="btn" onClick={() => dispatch({ type: 'BACK', now: Date.now() })} disabled={!canGoBack}>
        ← Back
      </button>
    );
    const repeatButton = (
      <button className="btn" onClick={repeat}>
        Repeat
      </button>
    );

    switch (step.kind) {
      case 'question':
      case 'checkin': {
        const recommended = step.kind === 'question' ? step.recommended : undefined;
        const answerButton = (value: Answer, label: string) => (
          <button
            className={`btn btn-big ${recommended === value ? 'btn-primary' : 'btn-answer'}`}
            onClick={() => answer(value)}
          >
            {label}
          </button>
        );
        return (
          <>
            {step.kind === 'question' && backButton}
            {repeatButton}
            {answerButton('no', 'No')}
            {answerButton('yes', 'Yes')}
          </>
        );
      }
      case 'info':
        return (
          <>
            {backButton}
            {repeatButton}
            <button className="btn btn-big btn-primary" onClick={() => dispatch({ type: 'NEXT', now: Date.now() })}>
              Next →
            </button>
          </>
        );
      case 'dose':
        return (
          <>
            {backButton}
            {repeatButton}
            <button className="btn btn-big btn-primary" onClick={() => dispatch({ type: 'DOSE_GIVEN', now: Date.now() })}>
              Dose given
            </button>
          </>
        );
      case 'wait':
        return (
          <>
            {repeatButton}
            {demo && (
              <button className="btn" onClick={() => dispatch({ type: 'SKIP_WAIT', now: Date.now() })}>
                Skip wait (demo)
              </button>
            )}
          </>
        );
      case 'end':
        return (
          <>
            <button className="btn" onClick={copyLog}>
              {copied ? 'Copied ✓' : 'Copy handoff log'}
            </button>
            <button className="btn btn-big btn-primary" onClick={restart}>
              Start over
            </button>
          </>
        );
    }
  }

  return (
    <div className={`app tone-${step?.tone ?? 'normal'}`}>
      <div className="banner">Prototype, not a medical device · For training and demonstration only</div>

      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" aria-hidden="true" />
          Dr.-VR
        </div>
        <div className="protocol-name">{protocol.title}</div>
        <div className="meta">
          {demo && <span className="pill pill-demo">Demo speed</span>}
          {state.startedAt !== null && <span className="pill">Elapsed {duration(now - state.startedAt)}</span>}
          <span className="pill">
            Doses {state.doses}/{protocol.maxDoses}
          </span>
          <VoiceStatus speech={speech} />
        </div>
      </header>

      <main className="stage">
        {state.status === 'idle' || !step || !view ? (
          <Idle onStart={start} voiceSupported={speech.supported} />
        ) : state.status === 'done' && state.startedAt !== null ? (
          // Outcome on the left, handoff log on the right, so it all fits on one screen.
          <div className="step step-end" key={state.visit}>
            <div className="end-summary">
              {step.illustration && <Illustration kind={step.illustration} />}
              {step.phase && <div className="phase">{step.phase}</div>}
              <h1 className="title">{view.title}</h1>
              <p className="text">{view.text}</p>
            </div>
            <HandoffLog log={state.log} startedAt={state.startedAt} />
          </div>
        ) : (
          <div className={`step step-${step.kind}`} key={state.visit}>
            <div className="visual">
              {step.bay !== undefined ? (
                <KitDiagram highlight={step.bay} />
              ) : (
                step.illustration && <Illustration kind={step.illustration} />
              )}
            </div>
            <div className="copy">
              {step.phase && <div className="phase">{step.phase}</div>}
              <h1 className="title">{view.title}</h1>
              <p className="text">{view.text}</p>
              {step.kind === 'wait' && state.timerEndsAt !== null && state.timerTotalMs !== null && (
                <Countdown endsAt={state.timerEndsAt} totalMs={state.timerTotalMs} now={now} />
              )}
              {step.kind === 'checkin' && state.timerEndsAt !== null && state.timerTotalMs !== null && (
                <SilenceBar endsAt={state.timerEndsAt} totalMs={state.timerTotalMs} now={now} />
              )}
            </div>
          </div>
        )}
      </main>

      <div className="heard" aria-live="polite">
        <HeardLine speech={speech} />
      </div>

      <footer className="controls">{controls()}</footer>

      <p className="sources">Step wording from: {protocol.sources.join(' · ')}</p>
    </div>
  );
}

function Idle({ onStart, voiceSupported }: { onStart: () => void; voiceSupported: boolean }) {
  return (
    <div className="idle">
      <div className="idle-mark" aria-hidden="true">
        +
      </div>
      <h1>Dr.-VR ready</h1>
      <p>Step-by-step help for a suspected opioid overdose.</p>
      <button className="btn btn-primary btn-huge" onClick={onStart} autoFocus>
        Start
      </button>
      <p className="idle-hint">
        {voiceSupported
          ? 'Voice turns on when you start. Say “yes”, “no”, “next”, “back”, “repeat” or “dose given”.'
          : 'Voice commands need Chrome or Edge. The buttons work everywhere.'}
      </p>
      <p className="idle-hint">Keyboard: Y / N · → next · ← back · D dose given · R repeat</p>
    </div>
  );
}

function VoiceStatus({ speech }: { speech: Speech }) {
  if (!speech.supported) return <span className="pill">Voice: buttons only</span>;
  return (
    <button
      className={`pill pill-voice${speech.listening ? ' on' : ''}`}
      onClick={speech.listening ? speech.stop : speech.listen}
      aria-pressed={speech.listening}
    >
      <span className="voice-dot" aria-hidden="true" />
      {speech.listening ? 'Listening' : 'Voice off'}
    </button>
  );
}

function HeardLine({ speech }: { speech: Speech }) {
  if (speech.error) return <span className="heard-error">{speech.error}</span>;
  if (speech.heard) {
    const { text, command, echo } = speech.heard;
    const outcome = echo ? 'ignored, that was the app’s own voice' : command ? `→ ${command}` : 'not a command';
    return (
      <>
        Heard “{text}” <span className="heard-outcome">{outcome}</span>
      </>
    );
  }
  return <>{speech.listening ? 'Listening…' : ' '}</>;
}
