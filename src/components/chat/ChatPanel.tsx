"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { streamChat } from "@/lib/chat-client";
import type { ChatMode } from "@/lib/chat-types";
import { settingsKey } from "@/lib/settings";
import { srsKey, customCardsKey, weakTags } from "@/lib/srsStore";
import { useStored, useHydrated } from "@/lib/useStored";
import { createRecognizer, speak, stopSpeaking, sttSupported, ttsSupported, unlockSpeech, type Recognizer } from "@/lib/speech";
import { uid } from "@/lib/storage";
import Button from "@/components/ui/Button";
import Icon from "@/components/Icon";

export interface ChatOption {
  id: string;
  label: string;
  summary: string;
  briefing: string[];       // shown in the drawer
  frequency?: string;       // radio: "Concord Ground 121.85"
  opensWith?: "pilot" | "atc";
}

interface Turn { id: string; role: "user" | "assistant"; text: string; coach?: string; error?: string; done: boolean }

export default function ChatPanel({ mode, options, selected, onSelect, placeholder, sendLabel }:
  { mode: ChatMode; options: ChatOption[]; selected: string | null; onSelect: (id: string | null) => void; placeholder: string; sendLabel: string }) {
  const hydrated = useHydrated();
  const [settings] = useStored(settingsKey);
  const [srs] = useStored(srsKey);
  const [, setCustom] = useStored(customCardsKey);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [interim, setInterim] = useState<string | null>(null);
  const [showBrief, setShowBrief] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const recRef = useRef<Recognizer | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const option = options.find((o) => o.id === selected) ?? null;
  const voice = settings.voiceEnabled && hydrated && ttsSupported();

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [turns.length, interim]);
  useEffect(() => () => { abortRef.current?.abort(); stopSpeaking(); recRef.current?.abort(); }, []);

  const pilot = { tailNumber: settings.tailNumber, callsign: settings.callsignSpoken, trainingAirport: settings.trainingAirport, homeAirport: settings.homeAirport };

  const send = (text: string, history = turns) => {
    const clean = text.trim();
    if ((!clean && history.length > 0) || streaming) return;
    stopSpeaking();
    const userTurn: Turn[] = clean ? [{ id: uid(), role: "user", text: clean, done: true }] : [];
    const assistant: Turn = { id: uid(), role: "assistant", text: "", done: false };
    const next = [...history, ...userTurn, assistant];
    setTurns(next);
    setInput("");
    setStreaming(true);
    const ctl = new AbortController();
    abortRef.current = ctl;
    const messages = [...history, ...userTurn].map((t) => ({ role: t.role, content: t.text }));
    const patch = (p: Partial<Turn>) => setTurns((ts) => ts.map((t) => (t.id === assistant.id ? { ...t, ...p } : t)));
    streamChat(
      { mode, scenarioId: mode === "radio" ? selected ?? undefined : undefined, areaId: mode === "oral" ? selected ?? undefined : undefined, weakTags: mode === "popquiz" ? weakTags(srs) : undefined, messages, pilot },
      { passcode: settings.passcode, signal: ctl.signal },
      {
        onSpeech: (s) => patch({ text: s }),
        onCoach: (c) => patch({ coach: c }),
        onDone: (s, c) => { patch({ text: s, coach: c || undefined, done: true }); setStreaming(false); if (voice && s) speak(s, { rate: settings.speechRate }); },
        onError: (m) => { patch({ error: m, done: true }); setStreaming(false); },
      }
    );
  };

  const start = () => {
    setTurns([]);
    setShowBrief(false);
    if (option?.opensWith === "atc" || mode === "popquiz" || mode === "oral") send("", []);
  };

  const pttDown = () => {
    if (streaming) return;
    unlockSpeech();
    const rec = createRecognizer({
      onInterim: (t) => setInterim(t),
      onFinal: (t) => { setInterim(null); send(t); },
      onError: () => setInterim(null),
      onEnd: () => setInterim((v) => (v ? v : null)),
    });
    if (!rec) return;
    recRef.current = rec;
    setInterim("");
    rec.start();
  };
  const pttUp = () => { recRef.current?.stop(); };

  const saveCard = (t: Turn, idx: number) => {
    const question = turns.slice(0, idx).reverse().find((x) => x.role === "assistant")?.text ?? "";
    if (!question || !t.coach) return;
    setCustom((cards) => [...cards, { id: `custom-${uid()}`, area: "custom", q: question, a: t.coach! }]);
  };

  return (
    <div className="flex min-h-[70dvh] flex-col">
      {/* picker + briefing */}
      <div className="mb-3 rounded-xl border border-border bg-surface">
        <div className="flex items-center gap-2 p-2">
          <select className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm" value={selected ?? ""} onChange={(e) => { onSelect(e.target.value || null); setTurns([]); setShowBrief(true); }}>
            {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <Button variant="ghost" className="h-9 px-2 text-xs" onClick={() => setShowBrief((v) => !v)} aria-expanded={showBrief}>{showBrief ? "Hide" : "Brief"}</Button>
          <Button variant="primary" className="h-9" onClick={start} disabled={streaming}>{turns.length ? "Restart" : "Start"}</Button>
        </div>
        {showBrief && option && (
          <div className="border-t border-border p-3 text-sm">
            {option.frequency && <p className="mb-1 font-mono text-xs text-amber">{option.frequency}</p>}
            <p className="text-fg/90">{option.summary}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">{option.briefing.map((b) => <li key={b}>{b}</li>)}</ul>
          </div>
        )}
      </div>

      {hydrated && !settings.passcode && (
        <p className="mb-3 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
          No passcode set. <Link href="/settings" className="underline">Enter it in Settings</Link> (it must match the server&rsquo;s APP_PASSCODE).
        </p>
      )}

      {/* transcript */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-2">
        {turns.length === 0 && <p className="py-8 text-center text-sm text-muted">{mode === "radio" && option?.opensWith !== "atc" ? "Press Start, then make your first call." : "Press Start."}</p>}
        {turns.map((t, i) => (
          <div key={t.id} className={t.role === "user" ? "flex justify-end" : ""}>
            {t.role === "user" ? (
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-sky/20 px-3 py-2 text-sm">{t.text}</p>
            ) : (
              <div className="max-w-[92%] space-y-1.5">
                {(t.text || !t.done) && (
                  <div className="rounded-2xl rounded-bl-sm border border-border bg-surface px-3 py-2 text-sm">
                    <p className="whitespace-pre-wrap">{t.text || <span className="text-muted">…</span>}</p>
                    {t.done && t.text && voice && (
                      <button className="mt-1 text-[11px] text-muted hover:text-fg" onClick={() => speak(t.text, { rate: settings.speechRate })}>↻ replay</button>
                    )}
                  </div>
                )}
                {t.coach && (
                  <div className="rounded-xl border border-amber/30 bg-amber/5 px-3 py-2 text-xs">
                    <p className="mb-0.5 font-semibold uppercase tracking-wide text-amber">{mode === "radio" ? "Instructor" : mode === "oral" ? "Examiner's notes" : "Answer"}</p>
                    <p className="whitespace-pre-wrap text-fg/90">{t.coach}</p>
                    {mode === "popquiz" && t.done && i > 0 && (
                      <button className="mt-1.5 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-surface-2" onClick={() => saveCard(t, i)}>+ Add to review deck</button>
                    )}
                  </div>
                )}
                {t.error && <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">{t.error}</p>}
              </div>
            )}
          </div>
        ))}
        {interim !== null && <p className="text-right text-xs italic text-muted">{interim || "listening…"}</p>}
        <div ref={bottomRef} />
      </div>

      {/* composer */}
      <form className="mt-2 flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        {hydrated && sttSupported() && (
          <button type="button" className={`h-11 w-11 shrink-0 rounded-full border ${interim !== null ? "border-danger bg-danger/20 text-danger" : "border-border bg-surface-2 text-muted"}`}
            onPointerDown={pttDown} onPointerUp={pttUp} onPointerCancel={pttUp} onPointerLeave={pttUp} aria-label="Hold to talk" disabled={streaming}>
            <Icon name="mic" className="mx-auto" />
          </button>
        )}
        <textarea className="min-h-11 flex-1 resize-none rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm outline-none focus:border-amber" rows={1}
          placeholder={placeholder} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} disabled={streaming || turns.length === 0} />
        <Button type="submit" variant="primary" className="h-11" disabled={streaming || !input.trim() || turns.length === 0}>{sendLabel}</Button>
      </form>
      <p className="mt-1 text-[11px] text-muted">{hydrated && sttSupported() ? "Hold the mic to talk, release to send. " : ""}Enter sends; Shift+Enter for a new line.</p>
    </div>
  );
}
