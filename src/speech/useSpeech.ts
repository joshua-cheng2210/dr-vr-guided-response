import { useCallback, useEffect, useRef, useState } from 'react';
import { isLikelyEcho, parseCommand, type Command } from './commands';

// The Web Speech recognition API isn't in TypeScript's DOM types, so describe the part we use.
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** How long after the app stops talking a heard phrase may still be its own echo. */
const ECHO_WINDOW_MS = 1500;

const FATAL_ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone blocked. Allow it in the address bar.',
  'service-not-allowed': 'Microphone blocked. Allow it in the address bar.',
  'audio-capture': 'No microphone found.',
  network: 'Voice commands need an internet connection.',
};

export interface Heard {
  text: string;
  command: Command | null;
  echo: boolean;
}

export interface Speech {
  supported: boolean;
  listening: boolean;
  error: string | null;
  heard: Heard | null;
  say: (text: string) => void;
  listen: () => void;
  stop: () => void;
}

export function useSpeech(onCommand: (command: Command) => void): Speech {
  const [supported] = useState(() => getRecognitionCtor() !== null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heard, setHeard] = useState<Heard | null>(null);

  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;
  const recognitionRef = useRef<Recognition | null>(null);
  const wantListeningRef = useRef(false);
  const restartsRef = useRef<number[]>([]);
  const lastSpokenRef = useRef({ text: '', speaking: false, endedAt: 0 });

  const say = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    lastSpokenRef.current = { text, speaking: true, endedAt: 0 };
    const finished = () => {
      // A cancelled utterance reports "end" late; only the current one may clear the flag.
      if (lastSpokenRef.current.text === text) lastSpokenRef.current = { text, speaking: false, endedAt: Date.now() };
    };
    utterance.onend = finished;
    utterance.onerror = finished;
    synth.speak(utterance);
  }, []);

  const handleTranscript = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const spoken = lastSpokenRef.current;
    const inEchoWindow = spoken.speaking || Date.now() - spoken.endedAt < ECHO_WINDOW_MS;
    if (inEchoWindow && isLikelyEcho(text, spoken.text)) {
      setHeard({ text, command: null, echo: true });
      return;
    }
    const command = parseCommand(text);
    setHeard({ text, command, echo: false });
    if (command) onCommandRef.current(command);
  }, []);

  const listen = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError('Voice commands need Chrome or Edge. Use the buttons.');
      return;
    }
    wantListeningRef.current = true;
    restartsRef.current = [];
    setError(null);

    if (!recognitionRef.current) {
      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = (e) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i];
          if (result.isFinal) handleTranscript(result[0].transcript);
        }
      };
      recognition.onerror = (e) => {
        const message = FATAL_ERRORS[e.error];
        if (message) {
          wantListeningRef.current = false;
          setError(message);
        }
      };
      // Chrome ends recognition after a pause; restart it, but give up if it keeps dying.
      recognition.onend = () => {
        if (!wantListeningRef.current) {
          setListening(false);
          return;
        }
        const now = Date.now();
        restartsRef.current = [...restartsRef.current.filter((t) => now - t < 10_000), now];
        if (restartsRef.current.length > 5) {
          wantListeningRef.current = false;
          setListening(false);
          setError('Voice keeps stopping. Use the buttons.');
          return;
        }
        try {
          recognition.start();
        } catch {
          // Already running.
        }
      };
      recognitionRef.current = recognition;
    }

    try {
      recognitionRef.current.start();
    } catch {
      // Already running.
    }
    setListening(true);
  }, [handleTranscript]);

  const stop = useCallback(() => {
    wantListeningRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  useEffect(
    () => () => {
      wantListeningRef.current = false;
      recognitionRef.current?.abort();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },
    [],
  );

  return { supported, listening, error, heard, say, listen, stop };
}
