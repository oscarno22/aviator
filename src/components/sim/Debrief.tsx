"use client";

import type { TaskResult, ParamResult } from "@/sim/scoring";
import Button from "@/components/ui/Button";

export default function Debrief({ result, onRetry, onClose }: { result: TaskResult; onRetry: () => void; onClose: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">Debrief</p>
          <h2 className="text-lg font-semibold">{result.title}</h2>
        </div>
        <span className={`rounded-md px-2 py-1 text-sm font-bold ${result.pass ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger"}`}>{result.pass ? "WITHIN STANDARDS" : "NOT YET"}</span>
      </div>

      {result.params.length > 0 && (
        <ul className="mt-3 space-y-2">
          {result.params.map((p) => <ParamRow key={p.key} p={p} />)}
        </ul>
      )}

      <ul className="mt-3 space-y-1 text-sm">
        {result.findings.map((f, i) => (
          <li key={i} className={f.severity === "fail" ? "text-danger" : f.severity === "warn" ? "text-warn" : "text-muted"}>
            {f.severity === "fail" ? "✕ " : f.severity === "warn" ? "! " : "· "}{f.text}
          </li>
        ))}
        <li className="text-muted">· Peak {result.maxG.toFixed(2)} g · minimum {result.minIas.toFixed(0)} kt · {result.durationSec.toFixed(0)} s</li>
      </ul>

      <div className="mt-4 flex gap-2">
        <Button variant="primary" onClick={onRetry}>Fly it again</Button>
        <Button onClick={onClose}>Back to tasks</Button>
      </div>
    </div>
  );
}

function ParamRow({ p }: { p: ParamResult }) {
  const unit = p.unit === "deg" ? "°" : p.unit === "deg/s" ? "°/s" : ` ${p.unit}`;
  return (
    <li className="rounded-lg bg-surface-2 p-2">
      <div className="flex items-center justify-between text-sm">
        <span className={p.pass ? "text-ok" : "text-danger"}>{p.label}</span>
        <span className="font-mono text-xs tabular text-muted">{Math.round(p.pctInTol * 100)}% in ±{p.tol}{unit} · max {p.maxDev >= 0 ? "+" : ""}{p.maxDev.toFixed(0)}{unit} at {p.maxDevAtSec.toFixed(0)} s</span>
      </div>
      <Sparkline series={p.series} target={p.target} tol={p.tol} />
    </li>
  );
}

function Sparkline({ series, target, tol }: { series: number[]; target: number; tol: number }) {
  if (series.length < 2) return null;
  const w = 300, h = 36;
  const span = Math.max(tol * 3, ...series.map((v) => Math.abs(v - target)));
  const y = (v: number) => h / 2 - ((v - target) / span) * (h / 2 - 2);
  const pts = series.map((v, i) => `${(i / (series.length - 1)) * w},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 h-9 w-full" preserveAspectRatio="none" aria-hidden="true">
      <rect x={0} y={y(target + tol)} width={w} height={Math.max(1, y(target - tol) - y(target + tol))} fill="rgba(52,211,153,0.12)" />
      <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="var(--border)" strokeDasharray="3 3" />
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
