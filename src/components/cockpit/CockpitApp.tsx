"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { type CockpitItem, type Zone, itemsInZone } from "@/data/cockpit";
import { checklistById } from "@/data/checklists";
import { grade, todayStr, type Grade } from "@/lib/srs";
import { srsKey, progressFor, shuffle } from "@/lib/srsStore";
import { useStored } from "@/lib/useStored";
import PageHeader from "@/components/ui/PageHeader";
import Segmented from "@/components/ui/Segmented";
import Button from "@/components/ui/Button";
import Icon from "@/components/Icon";
import { ZoneMap } from "./maps";

type Quiz = { queue: CockpitItem[]; index: number; revealed: boolean; score: Record<Grade, number> } | null;

export default function CockpitApp() {
  const [zone, setZone] = useState<Zone>("panel");
  const [selected, setSelected] = useState<CockpitItem | null>(null);
  const [quiz, setQuiz] = useState<Quiz>(null);
  const [, setAll] = useStored(srsKey);
  const items = useMemo(() => itemsInZone(zone), [zone]);

  const startQuiz = () => {
    setSelected(null);
    setQuiz({ queue: shuffle(items).slice(0, 10), index: 0, revealed: false, score: { again: 0, hard: 0, good: 0, easy: 0 } });
  };
  const target = quiz ? quiz.queue[quiz.index] ?? null : null;

  const onGrade = (g: Grade) => {
    if (!quiz || !target) return;
    const today = todayStr();
    const id = `cockpit-${target.id}`;
    setAll((all) => ({ ...all, [id]: grade(progressFor(all, id, today), g, today) }));
    setQuiz({ ...quiz, index: quiz.index + 1, revealed: false, score: { ...quiz.score, [g]: quiz.score[g] + 1 } });
  };

  const switchZone = (z: Zone) => { setZone(z); setSelected(null); setQuiz(null); };

  return (
    <>
      <PageHeader title="Cockpit" subtitle="Tap anything and ask yourself: what is it, what does it do, what do I check?"
        action={<Segmented value={zone} onChange={switchZone} options={[{ value: "panel", label: "Panel" }, { value: "walkaround", label: "Walkaround" }]} />} />

      <div className="rounded-xl border border-border bg-bg p-1">
        <ZoneMap zone={zone} selectedId={selected?.id ?? null} targetId={target?.id ?? null} showLabels={!quiz}
          onSelect={(it) => { if (!quiz) setSelected(it); }} />
      </div>

      {!quiz && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs text-muted">{items.length} items in this view.</p>
          <Button variant="primary" onClick={startQuiz}><Icon name="cards" size={16} /> What is this? quiz</Button>
        </div>
      )}

      {quiz && (
        <div className="mt-3 rounded-xl border border-accent/40 bg-surface p-4">
          {target ? (
            <>
              <div className="flex items-center justify-between text-xs text-muted">
                <span className="tabular">Item {quiz.index + 1} of {quiz.queue.length}</span>
                <button onClick={() => setQuiz(null)} className="hover:text-fg">End quiz</button>
              </div>
              <p className="mt-2 text-lg font-medium">The highlighted item: what is it, what does it do, and what do you check?</p>
              {!quiz.revealed ? (
                <Button variant="primary" className="mt-4" onClick={() => setQuiz({ ...quiz, revealed: true })}>Reveal</Button>
              ) : (
                <>
                  <ItemBody item={target} />
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Button variant="danger" onClick={() => onGrade("again")}>Missed it</Button>
                    <Button onClick={() => onGrade("good")}>Got it</Button>
                    <Button onClick={() => onGrade("easy")} className="text-sky">Cold</Button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center">
              <p className="text-lg font-medium">Done</p>
              <p className="mt-1 text-sm text-muted">Got it or cold: {quiz.score.good + quiz.score.easy} · Missed: {quiz.score.again}. Missed items come back in your quiz review.</p>
              <div className="mt-3 flex justify-center gap-2">
                <Button variant="primary" onClick={startQuiz}>Again</Button>
                <Button onClick={() => setQuiz(null)}>Back to map</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {selected && !quiz && (
        <div className="fixed inset-x-0 bottom-0 z-50 md:static md:mt-3" role="dialog" aria-label={selected.name}>
          <div className="mx-auto max-w-3xl rounded-t-2xl border border-border bg-surface p-4 pb-[calc(var(--sab)+16px)] shadow-2xl md:rounded-xl md:pb-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{selected.name}</h2>
              <button className="rounded-lg p-1 text-muted hover:text-fg" onClick={() => setSelected(null)} aria-label="Close"><Icon name="x" /></button>
            </div>
            <ItemBody item={selected} />
          </div>
        </div>
      )}

      {!quiz && (
        <ul className="mt-4 grid gap-1 text-sm sm:grid-cols-2">
          {items.map((it) => (
            <li key={it.id}>
              <button className={`w-full rounded-lg px-3 py-1.5 text-left hover:bg-surface-2 ${selected?.id === it.id ? "bg-surface-2 text-accent" : ""}`} onClick={() => setSelected(it)}>{it.name}</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ItemBody({ item }: { item: CockpitItem }) {
  return (
    <div className="mt-2 space-y-2 text-sm">
      <p><span className="font-semibold text-muted">What it is. </span>{item.whatItIs}</p>
      <p><span className="font-semibold text-muted">What it does. </span>{item.whatItDoes}</p>
      <p><span className="font-semibold text-accent">What to check. </span>{item.whatToCheck}</p>
      {item.gotchas && <p className="text-fg/80"><span className="font-semibold text-danger">Gotcha. </span>{item.gotchas}</p>}
      {item.checklistIds && item.checklistIds.length > 0 && (
        <p className="flex flex-wrap gap-2 pt-1">
          {item.checklistIds.map((id) => { const c = checklistById(id); return c ? <Link key={id} href={`/checklists/${id}`} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-2">{c.title}</Link> : null; })}
        </p>
      )}
    </div>
  );
}
