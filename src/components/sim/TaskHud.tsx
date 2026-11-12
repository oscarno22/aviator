"use client";

import type { PracticeTask, TaskContext, TaskParam } from "@/sim/tasks";
import type { InstrumentReadout } from "@/sim/types";
import { sequenceProgress, type StepProgress } from "@/sim/scoring";
import { angleDiff } from "@/lib/units";
import Button from "@/components/ui/Button";

const STEP_CLS: Record<StepProgress["status"], string> = {
  pending: "text-muted", active: "text-accent", overdue: "text-warn",
  onTime: "text-ok", late: "text-warn", early: "text-danger", missed: "text-danger",
};
const STEP_MARK: Record<StepProgress["status"], string> = {
  pending: "○", active: "●", overdue: "!", onTime: "✓", late: "✓", early: "✕", missed: "✕",
};
const STEP_WORD: Partial<Record<StepProgress["status"], string>> = { overdue: "now", late: "late", early: "early", missed: "missed" };

export default function TaskHud({ task, entry, r, elapsed, hud, ctx, coach, onCoach, onEnd }:
  {
    task: PracticeTask; entry: InstrumentReadout; r: InstrumentReadout; elapsed: number; hud: string;
    ctx?: TaskContext | null; coach: boolean; onCoach: (on: boolean) => void; onEnd: () => void;
  }) {
  const steps = task.sequence && ctx?.gates ? sequenceProgress(task.sequence, ctx) : null;
  const next = steps?.find((s) => s.status === "overdue" || s.status === "active");
  // Plain airwork params only; sequence tasks grade theirs in segments, so live numbers would mislead.
  const params = task.sequence ? [] : task.params;
  return (
    <div className="rounded-xl border border-accent/40 bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{task.title}</p>
          <p className="mt-0.5 text-xs text-accent">{hud}</p>
        </div>
        <span className="font-mono text-xs tabular text-muted">{elapsed.toFixed(0)} s</span>
      </div>

      {coach && next?.hint && (
        <p className="mt-2 rounded-lg bg-accent/15 px-2 py-1.5 text-sm font-semibold text-accent">{next.hint}</p>
      )}

      {steps && (
        <ol className="mt-2 space-y-0.5 text-xs">
          {steps.map((s) => (
            <li key={s.id} className={`flex gap-2 ${STEP_CLS[s.status]}`}>
              <span className="w-3 shrink-0 text-center">{STEP_MARK[s.status]}</span>
              <span className="flex-1">{s.label}{s.critical ? "" : " (minor)"}</span>
              {STEP_WORD[s.status] && <span className="shrink-0">{STEP_WORD[s.status]}</span>}
            </li>
          ))}
        </ol>
      )}

      {params.length > 0 && (
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-3">
          {params.map((p) => <ParamLine key={p.label} p={p} entry={entry} r={r} elapsed={elapsed} />)}
        </ul>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <Button variant="ghost" className="h-8 px-2 text-xs" onClick={onEnd}>End task</Button>
        {task.sequence && (
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" className="h-4 w-4 accent-accent" checked={coach} onChange={(e) => onCoach(e.target.checked)} />
            Coach prompts
          </label>
        )}
      </div>
      {task.sequence && coach && <p className="mt-1 text-[11px] text-muted">A coached run counts as practice: it will not push the task further out in your review queue.</p>}
    </div>
  );
}

function ParamLine({ p, entry, r, elapsed }: { p: TaskParam; entry: InstrumentReadout; r: InstrumentReadout; elapsed: number }) {
  const target = p.target === "entry" ? entry[p.key] : p.target;
  const d = p.wrap ? angleDiff(r[p.key], target) : r[p.key] - target;
  const lo = p.tolLow ?? p.tol, hi = p.tolHigh ?? p.tol;
  const grace = elapsed < (p.graceSec ?? 0);
  const ok = d >= -lo && d <= hi;
  const cls = grace ? "text-muted" : ok ? "text-ok" : "text-danger";
  return (
    <li className="flex justify-between gap-2 font-mono tabular">
      <span className="text-muted">{p.label}</span>
      <span className={cls}>{d >= 0 ? "+" : ""}{d.toFixed(0)} {p.unit === "deg/s" ? "°/s" : p.unit === "deg" ? "°" : p.unit}</span>
    </li>
  );
}
