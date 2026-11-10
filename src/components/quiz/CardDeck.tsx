"use client";

import { useEffect, useState } from "react";
import type { ConceptCard } from "@/data/concepts";
import { CONCEPT_AREAS } from "@/data/concepts";
import { grade, todayStr, type Grade } from "@/lib/srs";
import { srsKey, progressFor } from "@/lib/srsStore";
import { useStored } from "@/lib/useStored";
import Button from "@/components/ui/Button";
import Icon from "@/components/Icon";

export const GRADES: { g: Grade; label: string; hint: string; cls: string }[] = [
  { g: "again", label: "Again", hint: "blanked", cls: "border-danger/40 text-danger" },
  { g: "hard", label: "Hard", hint: "shaky", cls: "border-warn/40 text-warn" },
  { g: "good", label: "Good", hint: "got it", cls: "border-ok/40 text-ok" },
  { g: "easy", label: "Easy", hint: "instant", cls: "border-sky/40 text-sky" },
];

export default function CardDeck({ title, cards, mode, onExit, exitLabel = "Back to quiz" }: { title: string; cards: ConceptCard[]; mode: "review" | "area" | "pop"; onExit: () => void; exitLabel?: string }) {
  const [, setAll] = useStored(srsKey);
  const [queue, setQueue] = useState<ConceptCard[]>(cards);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState<Record<Grade, number>>({ again: 0, hard: 0, good: 0, easy: 0 });
  const total = cards.length;
  const card = queue[0];
  const answered = done.again + done.hard + done.good + done.easy;

  const onGrade = (g: Grade) => {
    if (!card) return;
    const today = todayStr();
    setAll((all) => ({ ...all, [card.id]: grade(progressFor(all, card.id, today), g, today) }));
    setDone((d) => ({ ...d, [g]: d[g] + 1 }));
    setQueue((q) => {
      const rest = q.slice(1);
      // "Again" comes back later in the same session (review mode only).
      return g === "again" && mode === "review" ? [...rest, card] : rest;
    });
    setFlipped(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!card) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped(true); }
      else if (flipped && ["1", "2", "3", "4"].includes(e.key)) onGrade(GRADES[Number(e.key) - 1].g);
      else if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!card) {
    const pct = total ? Math.round(((done.good + done.easy) / Math.max(1, answered)) * 100) : 0;
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <h2 className="text-xl font-semibold">{title} complete</h2>
        <p className="mt-2 text-muted">{answered} answers · {pct}% good or easy</p>
        <div className="mt-4 flex gap-4 text-sm">
          {GRADES.map((x) => <span key={x.g} className={x.cls.split(" ")[1]}>{x.label} {done[x.g]}</span>)}
        </div>
        <Button variant="primary" className="mt-8" onClick={onExit}>{exitLabel}</Button>
      </div>
    );
  }

  const areaLabel = CONCEPT_AREAS.find((a) => a.id === card.area)?.label ?? (card.area === "custom" ? "Saved from a pop quiz" : card.area);

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <button onClick={onExit} className="flex items-center gap-1 hover:text-fg"><Icon name="x" size={14} /> {title}</button>
        <span className="tabular">{Math.min(answered + 1, total)} / {total}{queue.length > total - answered ? ` (+${queue.length - (total - answered)} retry)` : ""}</span>
      </div>
      <div className="h-1 w-full rounded bg-surface-2"><div className="h-full rounded bg-accent" style={{ width: `${(answered / Math.max(1, total)) * 100}%` }} /></div>

      <button className="mt-4 flex flex-1 flex-col rounded-2xl border border-border bg-surface p-6 text-left" onClick={() => setFlipped(true)} aria-label="Reveal answer">
        <span className="text-xs uppercase tracking-wide text-muted">{areaLabel}</span>
        <span className="mt-3 text-xl font-medium leading-snug sm:text-2xl">{card.q}</span>
        {flipped ? (
          <span className="mt-6 border-t border-border pt-5">
            <span className="block text-lg leading-snug text-accent">{card.a}</span>
            {card.why && <span className="mt-3 block text-sm text-muted"><span className="font-semibold text-fg/80">Why? </span>{card.why}</span>}
          </span>
        ) : (
          <span className="mt-auto pt-8 text-sm text-muted">Say it out loud, then tap to reveal (Space)</span>
        )}
      </button>

      <div className={`mt-4 grid grid-cols-4 gap-2 transition ${flipped ? "" : "pointer-events-none opacity-30"}`}>
        {GRADES.map((x, i) => (
          <button key={x.g} onClick={() => onGrade(x.g)} className={`rounded-xl border bg-surface px-2 py-3 text-sm font-medium ${x.cls}`}>
            <span className="block">{x.label}</span>
            <span className="block text-[11px] font-normal text-muted">{x.hint} · {i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
