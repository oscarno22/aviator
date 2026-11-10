"use client";

import Link from "next/link";
import { useState } from "react";
import type { Checklist } from "@/data/checklists";
import { checklistProgressKey } from "@/lib/progress";
import { useStored } from "@/lib/useStored";
import Segmented from "@/components/ui/Segmented";
import Button from "@/components/ui/Button";
import Icon from "@/components/Icon";

type Mode = "run" | "quiz";

export default function ChecklistRunner({ checklist, next }: { checklist: Checklist; next: { id: string; title: string } | null }) {
  const [progress, setProgress] = useStored(checklistProgressKey);
  const [mode, setMode] = useState<Mode>(checklist.memory ? "quiz" : "run");
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const checked = new Set(progress[checklist.id] ?? []);
  const allDone = checked.size === checklist.items.length;

  const toggle = (i: number) => {
    setProgress((p) => {
      const cur = new Set(p[checklist.id] ?? []);
      if (cur.has(i)) cur.delete(i); else cur.add(i);
      return { ...p, [checklist.id]: [...cur].sort((a, b) => a - b) };
    });
  };
  const reset = () => {
    setProgress((p) => ({ ...p, [checklist.id]: [] }));
    setRevealed(new Set());
  };

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <Link href="/checklists" className="text-xs text-muted hover:text-fg">← Checklists</Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{checklist.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {checklist.phase === "emergency" ? "Emergency" : "Normal"} · {checklist.items.length} items
            {checklist.memory && <span className="ml-2 rounded bg-warn/15 px-1.5 py-0.5 text-[11px] font-semibold text-warn">MEMORY ITEMS</span>}
          </p>
        </div>
        <Segmented value={mode} onChange={(m) => { setMode(m); setRevealed(new Set()); }}
          options={[{ value: "run", label: "Run" }, { value: "quiz", label: "Quiz" }]} />
      </div>

      {mode === "quiz" && (
        <p className="mb-3 text-sm text-muted">Say the response out loud, then tap the line to reveal it.</p>
      )}

      <ol className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
        {checklist.items.map((item, i) => {
          const isChecked = mode === "run" && checked.has(i);
          const isRevealed = mode === "quiz" && revealed.has(i);
          return (
            <li key={i}>
              <button
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition ${isChecked ? "bg-surface-2/60" : "hover:bg-surface-2/40"}`}
                onClick={() => (mode === "run" ? toggle(i) : setRevealed((r) => { const n = new Set(r); if (n.has(i)) n.delete(i); else n.add(i); return n; }))}
                aria-pressed={isChecked}
              >
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${isChecked ? "border-accent bg-accent text-bg" : "border-border text-transparent"}`}>
                  <Icon name="check" size={16} />
                </span>
                <span className="flex-1">
                  <span className={`block ${isChecked ? "text-muted line-through decoration-muted/50" : ""}`}>{item.challenge}</span>
                  {item.note && !isChecked && <span className="mt-0.5 block text-xs text-muted">{item.note}</span>}
                </span>
                <span className={`ml-2 shrink-0 max-w-[45%] text-right font-mono text-sm uppercase tracking-tight ${mode === "quiz" && !isRevealed ? "rounded bg-surface-2 text-transparent select-none" : isChecked ? "text-muted" : "text-accent"}`}>
                  {item.response}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {mode === "run" && (
          <>
            <span className="text-sm text-muted tabular">{checked.size} / {checklist.items.length} complete</span>
            <Button variant="ghost" onClick={reset} className="ml-auto"><Icon name="reset" size={16} /> Reset</Button>
          </>
        )}
        {mode === "quiz" && (
          <>
            <Button variant="ghost" onClick={() => setRevealed(new Set(checklist.items.map((_, i) => i)))}>Reveal all</Button>
            <Button variant="ghost" onClick={() => setRevealed(new Set())}>Hide all</Button>
          </>
        )}
      </div>

      {allDone && mode === "run" && next && (
        <Link href={`/checklists/${next.id}`} className="mt-4 flex items-center justify-between rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-accent">
          <span>Checklist complete. Next: {next.title}</span>
          <Icon name="chevron" size={18} />
        </Link>
      )}
    </div>
  );
}
