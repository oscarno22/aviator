"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { streamChat } from "@/lib/chat-client";
import type { ChatMode } from "@/lib/chat-types";
import { settingsKey } from "@/lib/settings";
import { srsKey, customCardsKey, weakTags } from "@/lib/srsStore";
import { useStored, useHydrated } from "@/lib/useStored";
import { speak, stopSpeaking, ttsSupported } from "@/lib/speech";
import type { AiFailKind } from "@/lib/chat-types";
import Composer from "./Composer";
import OptionPicker, { type ChatOption } from "./OptionPicker";
import { uid } from "@/lib/storage";

export type { ChatOption } from "./OptionPicker";

interface Turn { id: string; role: "user" | "assistant"; text: string; coach?: string; error?: string; done: boolean }

export default function ChatPanel({ mode, options, selected, onSelect, placeholder, sendLabel, onFail, onOk, onSwitch }:
  {
    mode: ChatMode; options: ChatOption[]; selected: string | null; onSelect: (id: string | null) => void; placeholder: string; sendLabel: string;
    /** Called on every failed reply. `firstCall` is the student's text when nothing had been answered yet. */
    onFail?: (kind: AiFailKind, gotText: boolean, firstCall: string | null) => void;
    onOk?: () => void;
    /** Offered next to an error that did not switch modes by itself. */
    onSwitch?: () => void;
  }) {
  const hydrated = useHydrated();
  const [settings] = useStored(settingsKey);
  const [srs] = useStored(srsKey);
  const [, setCustom] = useStored(customCardsKey);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [showBrief, setShowBrief] = useState(true);
  // Separate from turns.length: when the pilot speaks first, Start leaves the transcript empty.
  const [started, setStarted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const option = options.find((o) => o.id === selected) ?? null;
  const voice = settings.voiceEnabled && hydrated && ttsSupported();

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [turns.length]);
  useEffect(() => () => { abortRef.current?.abort(); stopSpeaking(); }, []);

  const pilot = { tailNumber: settings.tailNumber, callsign: settings.callsignSpoken, trainingAirport: settings.trainingAirport, homeAirport: settings.homeAirport };

  const send = (text: string, history = turns) => {
    const clean = text.trim();
    if ((!clean && history.length > 0) || streaming) return;
    stopSpeaking();
    const userTurn: Turn[] = clean ? [{ id: uid(), role: "user", text: clean, done: true }] : [];
    const assistant: Turn = { id: uid(), role: "assistant", text: "", done: false };
    const next = [...history, ...userTurn, assistant];
    setTurns(next);
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
        onDone: (s, c) => { patch({ text: s, coach: c || undefined, done: true }); setStreaming(false); if (s) onOk?.(); if (voice && s) speak(s, { rate: settings.speechRate }); },
        onError: (m, kind, gotText) => {
          patch({ error: m, done: true });
          setStreaming(false);
          onFail?.(kind, gotText, history.some((t) => t.role === "assistant" && t.text) ? null : clean || null);
        },
      }
    );
  };

  const start = () => {
    setTurns([]);
    setShowBrief(false);
    setStarted(true);
    if (option?.opensWith === "atc" || mode === "popquiz" || mode === "oral") send("", []);
  };

  const saveCard = (t: Turn, idx: number) => {
    const question = turns.slice(0, idx).reverse().find((x) => x.role === "assistant")?.text ?? "";
    if (!question || !t.coach) return;
    setCustom((cards) => [...cards, { id: `custom-${uid()}`, area: "custom", q: question, a: t.coach! }]);
  };

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <OptionPicker options={options} selected={selected} onSelect={(id) => { onSelect(id); setTurns([]); setShowBrief(true); setStarted(false); }}
        showBrief={showBrief} onToggleBrief={() => setShowBrief((v) => !v)} onStart={start} started={started} disabled={streaming} />

      {hydrated && !settings.passcode && (
        <p className="mb-3 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
          No passcode set. <Link href="/settings" className="underline">Enter it in Settings</Link> (it must match the server&rsquo;s APP_PASSCODE).
        </p>
      )}

      {/* transcript */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-2">
        {turns.length === 0 && <p className="py-8 text-center text-sm text-muted">{started ? "Make your first call." : mode === "radio" && option?.opensWith !== "atc" ? "Press Start, then make your first call." : "Press Start."}</p>}
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
                  <div className="rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-xs">
                    <p className="mb-0.5 font-semibold uppercase tracking-wide text-accent">{mode === "radio" ? "Instructor" : mode === "oral" ? "Examiner's notes" : "Answer"}</p>
                    <p className="whitespace-pre-wrap text-fg/90">{t.coach}</p>
                    {mode === "popquiz" && t.done && i > 0 && (
                      <button className="mt-1.5 rounded-md border border-border px-2 py-1 text-[11px] hover:bg-surface-2" onClick={() => saveCard(t, i)}>+ Add to review deck</button>
                    )}
                  </div>
                )}
                {t.error && (
                  <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
                    {t.error}
                    {onSwitch && <button className="ml-2 underline" onClick={onSwitch}>Switch to the scripted version</button>}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <Composer placeholder={placeholder} sendLabel={sendLabel} disabled={streaming || !started} onSend={(t) => send(t)} />
    </div>
  );
}
