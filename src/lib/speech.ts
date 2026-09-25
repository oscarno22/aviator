/**
 * Thin wrappers over the Web Speech API. Everything is feature-detected and
 * optional: callers must work without voice.
 */
export function ttsSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let preferredVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (!ttsSupported()) return null;
  if (preferredVoice) return preferredVoice;
  const voices = window.speechSynthesis.getVoices();
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  preferredVoice =
    en.find((v) => /samantha|alex|google us english|aria|jenny/i.test(v.name)) ??
    en.find((v) => v.lang === "en-US") ??
    en[0] ??
    null;
  return preferredVoice;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    preferredVoice = null;
    pickVoice();
  });
}

/** Speak text, chunked on sentence boundaries (Chrome cuts long utterances). */
export function speak(text: string, opts: { rate?: number; onEnd?: () => void } = {}): void {
  if (!ttsSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const chunks = text.match(/[^.!?]+[.!?]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  const voice = pickVoice();
  chunks.forEach((chunk, i) => {
    const u = new SpeechSynthesisUtterance(chunk);
    u.rate = opts.rate ?? 1;
    u.lang = "en-US";
    if (voice) u.voice = voice;
    if (i === chunks.length - 1 && opts.onEnd) u.onend = opts.onEnd;
    synth.speak(u);
  });
}

export function stopSpeaking(): void {
  if (ttsSupported()) window.speechSynthesis.cancel();
}

/** Call from a user gesture once so iOS/Chrome allow later speak() calls. */
export function unlockSpeech(): void {
  if (!ttsSupported()) return;
  const u = new SpeechSynthesisUtterance(" ");
  u.volume = 0;
  window.speechSynthesis.speak(u);
}

// ---------------- Speech recognition ----------------

type RecognitionCtor = new () => SpeechRecognitionLike;
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function sttSupported(): boolean {
  return getCtor() !== null;
}

export interface Recognizer {
  start(): void;
  stop(): void;
  abort(): void;
}

export function createRecognizer(handlers: {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (err: string) => void;
  onEnd?: () => void;
}): Recognizer | null {
  const Ctor = getCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  let finalText = "";
  rec.onresult = (ev) => {
    let interim = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i];
      if (r.isFinal) finalText += r[0].transcript + " ";
      else interim += r[0].transcript;
    }
    handlers.onInterim?.((finalText + interim).trim());
  };
  rec.onerror = (ev) => handlers.onError?.(ev.error);
  rec.onend = () => {
    const t = finalText.trim();
    finalText = "";
    if (t) handlers.onFinal(t);
    handlers.onEnd?.();
  };
  return {
    start: () => {
      finalText = "";
      try { rec.start(); } catch (e) { handlers.onError?.(String(e)); }
    },
    stop: () => { try { rec.stop(); } catch {} },
    abort: () => { finalText = ""; try { rec.abort(); } catch {} },
  };
}
