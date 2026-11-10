"use client";

import { useMemo, useState } from "react";
import { ORAL_BANK, type OralQuestion } from "@/data/oralBank";
import { ORAL_AREAS } from "@/data/oralTopics";
import { isDue, todayStr, type CardProgress, type Grade } from "@/lib/srs";
import { shuffle, srsKey } from "@/lib/srsStore";
import { recordOutcome, reviewId } from "@/lib/review";
import { useStored } from "@/lib/useStored";
import Button from "@/components/ui/Button";

export const SESSION_SIZE = 8;

export const ORAL_GRADES: { g: Grade; label: string; cls: string }[] = [
  { g: "again", label: "Missed", cls: "border-danger/40 text-danger" },
  { g: "hard", label: "Partly", cls: "border-warn/40 text-warn" },
  { g: "good", label: "Got it", cls: "border-ok/40 text-ok" },
  { g: "easy", label: "Instant", cls: "border-sky/40 text-sky" },
];

/** Due questions first (oldest first), then never-seen ones, then the rest. */
export function pickOral(bank: OralQuestion[], srs: Record<string, CardProgress>, areaId: string, n = SESSION_SIZE, today = todayStr(), seed = Math.random()): OralQuestion[] {
  const pool = areaId === "all" ? bank : bank.filter((q) => q.areaId === areaId);
  const prog = (q: OralQuestion) => srs[reviewId("oral", q.id)];
  const due = pool.filter((q) => prog(q) && isDue(prog(q), today)).sort((a, b) => (prog(a).due < prog(b).due ? -1 : 1));
  const fresh = shuffle(pool.filter((q) => !prog(q)), seed);
  const rest = shuffle(pool.filter((q) => prog(q) && !isDue(prog(q), today)), seed);
  return [...due, ...fresh, ...rest].slice(0, n);
}

/** Suggest a grade from how many key points were ticked. */
export function suggestGrade(ticked: number, total: number): Grade {
  if (total === 0 || ticked * 2 < total) return "again";
  return ticked < total ? "hard" : "good";
}

/** One self-graded question: say it, reveal, tick the points, grade. Reused by the warm-up. */
export function OralQuestionCard({ q, onGrade }: { q: OralQuestion; onGrade: (g: Grade) => void }) {
  const [revealed, setRevealed] = useState(false);
  const [ticks, setTicks] = useState<boolean[]>(() => q.keyPoints.map(() => false));
  const [followUp, setFollowUp] = useState(false);
  const area = ORAL_AREAS.find((a) => a.id === q.areaId);
  const suggested = suggestGrade(ticks.filter(Boolean).length, ticks.length);
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 rounded-2xl border border-border bg-surface p-5">
        <p className="text-xs uppercase tracking-wide text-muted">{area ? `${area.acs} · ${area.label}` : q.areaId}{q.local ? " · local" : ""}</p>
        <p className="mt-3 text-lg font-medium leading-snug">{q.q}</p>
        {!revealed ? (
          <Button variant="primary" className="mt-6" onClick={() => setRevealed(true)}>I answered out loud: show the answer</Button>
        ) : (
          <div className="mt-5 border-t border-border pt-4 text-sm">
            <p className="text-base leading-snug text-accent">{q.answer}</p>
            <p className="mt-3 text-xs text-muted">Tick what your answer covered:</p>
            <ul className="mt-1 space-y-1.5">
              {q.keyPoints.map((k, i) => (
                <li key={k}>
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-accent" checked={ticks[i]} onChange={(e) => setTicks((t) => t.map((v, j) => (j === i ? e.target.checked : v)))} />
                    {k}
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-muted">{q.ref}{q.verified ? "" : " · not yet checked by an instructor"}</p>
            {q.followUp && (
              <div className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-xs">
                <p className="font-semibold text-silver">Follow-up: {q.followUp.q}</p>
                {followUp ? <p className="mt-1">{q.followUp.answer}</p> : <button className="mt-1 underline" onClick={() => setFollowUp(true)}>Show</button>}
              </div>
            )}
          </div>
        )}
      </div>
      <div className={`mt-3 grid grid-cols-4 gap-2 transition ${revealed ? "" : "pointer-events-none opacity-30"}`}>
        {ORAL_GRADES.map((x) => (
          <button key={x.g} onClick={() => onGrade(x.g)} className={`rounded-xl border bg-surface px-2 py-3 text-sm font-medium ${x.cls} ${revealed && x.g === suggested ? "ring-2 ring-accent/60" : ""}`}>{x.label}</button>
        ))}
      </div>
    </div>
  );
}

/** Self-graded oral exam from the built-in question bank. No AI. */
export default function OralBank({ initialArea = "all" }: { initialArea?: string }) {
  const [srs] = useStored(srsKey);
  const [area, setArea] = useState(initialArea);
  const [session, setSession] = useState<OralQuestion[] | null>(null);
  const [i, setI] = useState(0);
  const [tally, setTally] = useState<Record<Grade, number>>({ again: 0, hard: 0, good: 0, easy: 0 });
  const counts = useMemo(() => {
    const pool = area === "all" ? ORAL_BANK : ORAL_BANK.filter((q) => q.areaId === area);
    const today = todayStr();
    return { total: pool.length, due: pool.filter((q) => { const p = srs[reviewId("oral", q.id)]; return p && isDue(p, today); }).length, seen: pool.filter((q) => srs[reviewId("oral", q.id)]).length };
  }, [area, srs]);

  const start = () => { setSession(pickOral(ORAL_BANK, srs, area)); setI(0); setTally({ again: 0, hard: 0, good: 0, easy: 0 }); };
  const q = session?.[i];

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-border bg-surface p-2">
        <select className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm" value={area} onChange={(e) => { setArea(e.target.value); setSession(null); }} aria-label="Area of operation">
          <option value="all">Whole checkride oral (all areas)</option>
          {ORAL_AREAS.map((a) => <option key={a.id} value={a.id}>{a.acs} · {a.label}</option>)}
        </select>
        <Button variant="primary" className="h-9" onClick={start}>{session ? "Restart" : "Start"}</Button>
      </div>

      {!session && (
        <p className="py-8 text-center text-sm text-muted">
          {counts.total} questions here · {counts.seen} seen · {counts.due} due for review.<br />Answer out loud first, then check yourself against the model answer.
        </p>
      )}

      {session && q && (
        <>
          <p className="mb-2 text-right text-xs text-muted tabular">{i + 1} / {session.length}</p>
          <OralQuestionCard key={q.id} q={q} onGrade={(g) => { recordOutcome(reviewId("oral", q.id), g); setTally((t) => ({ ...t, [g]: t[g] + 1 })); setI((n) => n + 1); }} />
        </>
      )}

      {session && !q && (
        <div className="flex flex-col items-center py-12 text-center">
          <h2 className="text-xl font-semibold">Session complete</h2>
          <div className="mt-4 flex gap-4 text-sm">{ORAL_GRADES.map((x) => <span key={x.g} className={x.cls.split(" ")[1]}>{x.label} {tally[x.g]}</span>)}</div>
          <p className="mt-3 text-sm text-muted">Missed and partly answered questions come back in your review queue.</p>
          <Button variant="primary" className="mt-6" onClick={start}>Another round</Button>
        </div>
      )}
    </div>
  );
}
