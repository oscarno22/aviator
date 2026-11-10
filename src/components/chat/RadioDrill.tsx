"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { scenarioById } from "@/data/radioScenarios";
import { fill, modelText, renderModel, scriptFor, type ScriptTurn } from "@/data/radioScripts";
import { checkCall, gradeDrill, type ElementResult } from "@/lib/radio/check";
import { slotsFor } from "@/lib/radio/slots";
import { drillLogKey, logDrill } from "@/lib/drillLog";
import { recordOutcome, reviewId } from "@/lib/review";
import { settingsKey } from "@/lib/settings";
import { speak, stopSpeaking, ttsSupported } from "@/lib/speech";
import { read } from "@/lib/storage";
import { useHydrated, useStored } from "@/lib/useStored";
import Button from "@/components/ui/Button";
import Icon from "@/components/Icon";
import Composer from "./Composer";
import OptionPicker, { type ChatOption } from "./OptionPicker";

type Checked = ElementResult & { overridden?: boolean };
interface Done { turn: ScriptTurn; said: string; results: Checked[] }

const GRADE_TEXT = { again: "Fly it again soon", hard: "Close: back in a day or so", good: "Clean", easy: "Clean twice running" } as const;

/**
 * Scripted radio drill: no AI. Each call is checked for its required elements,
 * the model call is shown with the missed parts marked, and the result feeds the review queue.
 */
export default function RadioDrill({ options, selected, onSelect, initialCall }:
  { options: ChatOption[]; selected: string | null; onSelect: (id: string | null) => void; initialCall?: string | null }) {
  const hydrated = useHydrated();
  const [settings] = useStored(settingsKey);
  const scenario = selected ? scenarioById(selected) : undefined;
  const script = selected ? scriptFor(selected) : undefined;
  const ctx = useMemo(() => (scenario && script ? slotsFor(scenario, script, settings) : null), [scenario, script, settings]);
  const voice = settings.voiceEnabled && hydrated && ttsSupported();

  const evaluate = (turn: ScriptTurn, text: string): Checked[] =>
    turn.expect && ctx ? checkCall(text, turn.expect.elements, ctx.slots) : [];

  // If Claude failed on the very first call, score that call here instead of losing it.
  const carried = initialCall && script?.turns[0]?.expect ? initialCall : null;
  const [started, setStarted] = useState(!!carried);
  const [showBrief, setShowBrief] = useState(!carried);
  const [done, setDone] = useState<Done[]>([]);
  const [pending, setPending] = useState<{ said: string; results: Checked[]; ticks: boolean[] } | null>(
    () => (carried && script ? { said: carried, results: evaluate(script.turns[0], carried), ticks: [] } : null));
  const [grade, setGrade] = useState<keyof typeof GRADE_TEXT | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const idx = done.length;
  const turn = script?.turns[idx];
  const finished = started && !!script && idx >= script.turns.length;
  const speaker = (t: ScriptTurn) => t.speaker ?? scenario?.facility.replace(/\s*\(.*\)$/, "") ?? "ATC";
  const line = (t: ScriptTurn) => (t.atc && ctx ? fill(t.atc, ctx.vars) : "");

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [idx, pending, finished]);
  useEffect(() => () => stopSpeaking(), []);
  // Read each new controller line aloud.
  useEffect(() => {
    if (started && turn?.atc && voice && !pending && ctx) speak(fill(turn.atc, ctx.vars), { rate: settings.speechRate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, idx]);

  const reset = (start: boolean) => { stopSpeaking(); setDone([]); setPending(null); setGrade(null); setStarted(start); setShowBrief(!start); };

  const onSay = (text: string) => {
    if (!turn || pending) return;
    stopSpeaking();
    setPending({ said: text, results: evaluate(turn, text), ticks: turn.selfGrade ? turn.selfGrade.keyPoints.map(() => false) : [] });
  };

  const next = () => {
    if (!turn || !pending || !script || !selected) return;
    const results: Checked[] = turn.selfGrade
      ? turn.selfGrade.keyPoints.map((k, i) => ({ id: `${turn.id}-${i}`, label: k, hit: pending.ticks[i], critical: false }))
      : pending.results;
    const all = [...done, { turn, said: pending.said, results }];
    setDone(all);
    setPending(null);
    if (all.length === script.turns.length) {
      const id = reviewId("radio", selected);
      const flat = all.flatMap((d) => d.results);
      const g = gradeDrill(flat, !!read(drillLogKey)[id]?.lastOk);
      const missed = all.flatMap((d) => d.results.filter((r) => !r.hit).map((r) => `${d.turn.id}/${r.id}`));
      recordOutcome(id, g);
      logDrill(id, missed.length === 0 && !flat.some((r) => r.overridden), missed);
      setGrade(g);
    }
  };

  const override = (id: string) => setPending((p) => p && { ...p, results: p.results.map((r) => (r.id === id ? { ...r, hit: true, overridden: true } : r)) });

  const total = done.flatMap((d) => d.results);
  const missedCount = total.filter((r) => !r.hit).length;

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <OptionPicker options={options} selected={selected} onSelect={(id) => { onSelect(id); reset(false); }}
        showBrief={showBrief} onToggleBrief={() => setShowBrief((v) => !v)} onStart={() => reset(true)} started={started} />

      <div className="flex-1 space-y-3 pb-2">
        {!started && <p className="py-8 text-center text-sm text-muted">Press Start. Say each call out loud; the app checks it for the parts a controller needs.</p>}
        {!script && started && <p className="py-8 text-center text-sm text-muted">No scripted version of this scenario yet.</p>}

        {done.map((d) => (
          <div key={d.turn.id} className="space-y-1.5 opacity-70">
            {d.turn.atc && <AtcLine who={speaker(d.turn)} text={line(d.turn)} />}
            <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-sky/20 px-3 py-2 text-sm">{d.said}</p>
            <p className="text-right text-[11px] text-muted">{d.results.filter((r) => r.hit).length} of {d.results.length} parts</p>
          </div>
        ))}

        {started && turn && ctx && (
          <div className="space-y-2">
            {turn.atc && <AtcLine who={speaker(turn)} text={line(turn)} onReplay={voice ? () => speak(line(turn), { rate: settings.speechRate }) : undefined} />}
            {turn.cue && <p className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-silver">{turn.cue}</p>}

            {pending && (
              <>
                <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-sky/20 px-3 py-2 text-sm">{pending.said}</p>
                {turn.expect ? (
                  <Feedback turn={turn} results={pending.results} vars={ctx.vars} onOverride={override}
                    onReplay={voice ? (t) => speak(t, { rate: settings.speechRate }) : undefined} />
                ) : turn.selfGrade && (
                  <div className="rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-sm">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">Answer</p>
                    <p>{turn.selfGrade.modelAnswer}</p>
                    <p className="mt-2 text-xs text-muted">Tick what you covered:</p>
                    <ul className="mt-1 space-y-1">
                      {turn.selfGrade.keyPoints.map((k, i) => (
                        <li key={k}>
                          <label className="flex items-start gap-2 text-sm">
                            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-accent" checked={pending.ticks[i]} onChange={(e) => setPending((p) => p && { ...p, ticks: p.ticks.map((t, j) => (j === i ? e.target.checked : t)) })} />
                            {k}
                          </label>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[11px] text-muted">{turn.selfGrade.ref}</p>
                  </div>
                )}
                <Button variant="primary" className="w-full" onClick={next}>{idx + 1 === script!.turns.length ? "Finish" : "Next call"}</Button>
              </>
            )}
          </div>
        )}

        {finished && grade && (
          <div className="rounded-xl border border-border bg-surface p-4 text-sm">
            <p className="text-base font-semibold">Scenario complete</p>
            <p className="mt-1 text-muted">{total.length - missedCount} of {total.length} required parts. {GRADE_TEXT[grade]}.</p>
            {missedCount > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-warn">
                {done.flatMap((d) => d.results.filter((r) => !r.hit).map((r) => <li key={`${d.turn.id}-${r.id}`}>{r.label}</li>))}
              </ul>
            )}
            <p className="mt-2 text-[11px] text-muted">Phraseology in these drills has not been checked by an instructor yet. If your CFI says it differently, your CFI is right.</p>
            <Button className="mt-3" onClick={() => reset(true)}><Icon name="reset" size={16} /> Fly it again</Button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {started && turn && !pending && (
        <Composer placeholder={turn.selfGrade ? "Your answer…" : "Your call…"} sendLabel={turn.selfGrade ? "Answer" : "Transmit"} onSend={onSay} />
      )}
    </div>
  );
}

function AtcLine({ who, text, onReplay }: { who: string; text: string; onReplay?: () => void }) {
  return (
    <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-border bg-surface px-3 py-2 text-sm">
      <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{who}</p>
      <p>{text}</p>
      {onReplay && <button className="mt-1 text-[11px] text-muted hover:text-fg" onClick={onReplay}>↻ replay</button>}
    </div>
  );
}

function Feedback({ turn, results, vars, onOverride, onReplay }:
  { turn: ScriptTurn; results: Checked[]; vars: Record<string, string>; onOverride: (id: string) => void; onReplay?: (text: string) => void }) {
  const segs = renderModel(turn.expect!.model, vars);
  const missed = new Set(results.filter((r) => !r.hit).map((r) => r.id));
  const criticalMiss = results.some((r) => !r.hit && r.critical);
  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm">
      <ul className="space-y-1">
        {results.map((r) => (
          <li key={r.id} className="flex items-start gap-2">
            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${r.hit ? "bg-ok/20 text-ok" : r.critical ? "bg-danger/20 text-danger" : "bg-warn/20 text-warn"}`}>
              <Icon name={r.hit ? "check" : "x"} size={11} />
            </span>
            <span className="min-w-0 flex-1">
              <span className={r.hit ? "" : "font-medium"}>{r.label}</span>
              {r.overridden && <span className="ml-1 text-[11px] text-muted">(you said it)</span>}
              {!r.hit && r.hint && <span className="block text-xs text-muted">{r.hint}</span>}
            </span>
            {!r.hit && <button className="shrink-0 rounded-md border border-border px-2 py-0.5 text-[11px] text-muted hover:bg-surface-2 hover:text-fg" onClick={() => onOverride(r.id)}>I said it</button>}
          </li>
        ))}
      </ul>
      {criticalMiss && turn.expect!.onMissAtc && (
        <p className="rounded-lg bg-warn/10 px-2 py-1.5 text-xs text-warn">The controller would come back with: &ldquo;{fill(turn.expect!.onMissAtc, vars)}&rdquo;</p>
      )}
      <div className="border-t border-border pt-2">
        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">Model call</p>
        <p>
          {segs.map((s, i) => (
            <span key={i} className={s.el && missed.has(s.el) ? "rounded bg-warn/20 px-0.5 text-warn" : ""}>{s.text}</span>
          ))}
        </p>
        {onReplay && <button className="mt-1 text-[11px] text-muted hover:text-fg" onClick={() => onReplay(modelText(segs))}>↻ hear it</button>}
      </div>
    </div>
  );
}
