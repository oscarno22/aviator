"use client";

import { useEffect, useRef, useState } from "react";
import { createRecognizer, sttSupported, unlockSpeech, type Recognizer } from "@/lib/speech";
import { useHydrated } from "@/lib/useStored";
import Button from "@/components/ui/Button";
import Icon from "@/components/Icon";

/** Hold-to-talk mic plus a text box. Shared by the Claude chat and the scripted drills. */
export default function Composer({ placeholder, sendLabel, disabled, onSend }:
  { placeholder: string; sendLabel: string; disabled?: boolean; onSend: (text: string) => void }) {
  const hydrated = useHydrated();
  const [input, setInput] = useState("");
  const [interim, setInterim] = useState<string | null>(null);
  const recRef = useRef<Recognizer | null>(null);
  const sendRef = useRef(onSend);
  useEffect(() => { sendRef.current = onSend; });
  useEffect(() => () => { recRef.current?.abort(); }, []);
  const mic = hydrated && sttSupported();

  const submit = (text: string) => {
    const clean = text.trim();
    if (!clean || disabled) return;
    setInput("");
    sendRef.current(clean);
  };

  const pttDown = () => {
    if (disabled) return;
    unlockSpeech();
    const rec = createRecognizer({
      onInterim: (t) => setInterim(t),
      onFinal: (t) => { setInterim(null); submit(t); },
      onError: () => setInterim(null),
      onEnd: () => setInterim((v) => (v ? v : null)),
    });
    if (!rec) return;
    recRef.current = rec;
    setInterim("");
    rec.start();
  };
  const pttUp = () => { recRef.current?.stop(); };

  return (
    <div>
      {interim !== null && <p className="mb-1 text-right text-xs italic text-muted">{interim || "listening…"}</p>}
      <form className="mt-2 flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); submit(input); }}>
        {mic && (
          <button type="button" className={`h-11 w-11 shrink-0 rounded-full border ${interim !== null ? "border-danger bg-danger/20 text-danger" : "border-border bg-surface-2 text-muted"}`}
            onPointerDown={pttDown} onPointerUp={pttUp} onPointerCancel={pttUp} onPointerLeave={pttUp} aria-label="Hold to talk" disabled={disabled}>
            <Icon name="mic" className="mx-auto" />
          </button>
        )}
        <textarea className="min-h-11 flex-1 resize-none rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-accent" rows={1}
          placeholder={placeholder} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }} disabled={disabled} />
        <Button type="submit" variant="primary" className="h-11" disabled={disabled || !input.trim()}>{sendLabel}</Button>
      </form>
      <p className="mt-1 text-[11px] text-muted">{mic ? "Hold the mic to talk, release to send. " : ""}Enter sends; Shift+Enter for a new line.</p>
    </div>
  );
}
