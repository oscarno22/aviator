"use client";

import type { PracticeTask, TaskParam } from "@/sim/tasks";
import type { InstrumentReadout } from "@/sim/types";
import { angleDiff } from "@/lib/units";
import Button from "@/components/ui/Button";

export default function TaskHud({ task, entry, r, elapsed, hud, onEnd }:
  { task: PracticeTask; entry: InstrumentReadout; r: InstrumentReadout; elapsed: number; hud: string; onEnd: () => void }) {
  return (
    <div className="rounded-xl border border-amber/40 bg-surface p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{task.title}</p>
          <p className="mt-0.5 text-xs text-amber">{hud}</p>
        </div>
        <span className="font-mono text-xs tabular text-muted">{elapsed.toFixed(0)} s</span>
      </div>
      {task.params.length > 0 && (
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-3">
          {task.params.map((p) => <ParamLine key={p.key} p={p} entry={entry} r={r} elapsed={elapsed} />)}
        </ul>
      )}
      <Button variant="ghost" className="mt-2 h-8 px-2 text-xs" onClick={onEnd}>End task</Button>
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
