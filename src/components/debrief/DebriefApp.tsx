"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MANEUVERS } from "@/data/maneuvers";
import { debriefsKey, type Debrief, type DebriefItem, type DebriefRating } from "@/lib/debrief";
import { todayStr } from "@/lib/srs";
import { uid } from "@/lib/storage";
import { useStored } from "@/lib/useStored";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const AREAS = [...new Set(MANEUVERS.map((m) => m.area))];
const RATING_CLS: Record<DebriefRating, string> = { shaky: "border-warn/50 bg-warn/10 text-warn", bad: "border-danger/50 bg-danger/10 text-danger" };
const RATING_TEXT: Record<DebriefRating, string> = { shaky: "shaky", bad: "problem" };
const INPUT = "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-accent";

/** Post-lesson debrief: what was flown, what went badly, what the instructor said. */
export default function DebriefApp() {
  const params = useSearchParams();
  const [debriefs, setDebriefs] = useStored(debriefsKey);
  const [date, setDate] = useState(() => params.get("date") ?? todayStr());
  const [flown, setFlown] = useState<string[]>([]);
  // key: "<maneuverId>|<error text>" or "other|<text>"
  const [marks, setMarks] = useState<Record<string, DebriefRating>>({});
  const [other, setOther] = useState("");
  const [comments, setComments] = useState("");
  const [saved, setSaved] = useState<Debrief | null>(null);
  const sorted = useMemo(() => [...debriefs].sort((a, b) => (a.date < b.date ? 1 : -1)), [debriefs]);

  const toggleFlown = (id: string) => setFlown((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  // Tap cycles: off -> shaky -> problem -> off.
  const cycle = (key: string) => setMarks((m) => {
    const next = { ...m };
    if (!m[key]) next[key] = "shaky"; else if (m[key] === "shaky") next[key] = "bad"; else delete next[key];
    return next;
  });
  const addOther = () => { const t = other.trim(); if (!t) return; setMarks((m) => ({ ...m, [`other|${t}`]: "shaky" })); setOther(""); };

  const save = () => {
    const items: DebriefItem[] = Object.entries(marks)
      .filter(([key]) => key.startsWith("other|") || flown.includes(key.split("|")[0]))
      .map(([key, rating]) => {
        const [mid, ...rest] = key.split("|");
        return { id: uid(), text: rest.join("|"), rating, maneuverId: mid === "other" ? undefined : mid };
      });
    const d: Debrief = { id: uid(), date, flown, items, cfiComments: comments.trim() };
    setDebriefs((all) => [...all, d]);
    setSaved(d);
    setFlown([]); setMarks({}); setComments("");
  };
  const remove = (id: string) => { if (confirm("Delete this debrief? Its review items go with it.")) setDebriefs((all) => all.filter((d) => d.id !== id)); };

  const canSave = flown.length > 0 || Object.keys(marks).length > 0 || comments.trim().length > 0;

  return (
    <>
      <PageHeader title="Debrief" subtitle="Right after the lesson, while it is fresh. It takes about a minute." />

      {saved && (
        <p className="mb-4 rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">
          Saved. {saved.items.length ? `${saved.items.length} item${saved.items.length === 1 ? "" : "s"} added to your review queue. ` : ""}
          <Link href="/review" className="underline">Open review</Link>
        </p>
      )}

      <Card className="mb-4">
        <CardTitle>1 · What did you fly?</CardTitle>
        <label className="mb-3 block text-sm">
          <span className="mb-1 block text-xs text-muted">Lesson date</span>
          <input type="date" className={INPUT + " w-auto"} value={date} max={todayStr()} onChange={(e) => setDate(e.target.value || todayStr())} />
        </label>
        {AREAS.map((area) => (
          <div key={area} className="mb-2">
            <p className="mb-1 text-xs text-muted">{area}</p>
            <div className="flex flex-wrap gap-1.5">
              {MANEUVERS.filter((m) => m.area === area).map((m) => (
                <button key={m.id} onClick={() => toggleFlown(m.id)} aria-pressed={flown.includes(m.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${flown.includes(m.id) ? "border-accent bg-accent/15 text-accent" : "border-border text-fg/80"}`}>{m.name}</button>
              ))}
            </div>
          </div>
        ))}
      </Card>

      <Card className="mb-4">
        <CardTitle>2 · What went badly?</CardTitle>
        {flown.length === 0 && <p className="text-sm text-muted">Pick what you flew and the usual trouble spots for each will appear here.</p>}
        {flown.length > 0 && <p className="mb-2 text-xs text-muted">Tap once for shaky, twice for a real problem, three times to clear.</p>}
        {flown.map((id) => {
          const m = MANEUVERS.find((x) => x.id === id)!;
          return (
            <div key={id} className="mb-3">
              <p className="mb-1 text-sm font-medium">{m.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {m.commonErrors.map((e) => {
                  const r = marks[`${id}|${e}`];
                  return (
                    <button key={e} onClick={() => cycle(`${id}|${e}`)}
                      className={`rounded-lg border px-2.5 py-1.5 text-left text-xs ${r ? RATING_CLS[r] : "border-border text-fg/80"}`}>
                      {e}{r && <span className="ml-1 font-semibold">· {RATING_TEXT[r]}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {Object.entries(marks).filter(([k]) => k.startsWith("other|")).map(([k, r]) => (
          <button key={k} onClick={() => cycle(k)} className={`mb-1.5 mr-1.5 rounded-lg border px-2.5 py-1.5 text-left text-xs ${RATING_CLS[r]}`}>
            {k.slice(6)}<span className="ml-1 font-semibold">· {RATING_TEXT[r]}</span>
          </button>
        ))}
        <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); addOther(); }}>
          <input className={INPUT} placeholder="Something else, in your own words" value={other} onChange={(e) => setOther(e.target.value)} />
          <Button type="submit" disabled={!other.trim()}>Add</Button>
        </form>
      </Card>

      <Card className="mb-4">
        <CardTitle>3 · What did your instructor say?</CardTitle>
        <textarea className={INPUT} rows={3} placeholder="Their words, as close as you remember" value={comments} onChange={(e) => setComments(e.target.value)} />
        <Button variant="primary" className="mt-3 w-full" disabled={!canSave} onClick={save}>Save debrief</Button>
      </Card>

      {sorted.length > 0 && (
        <Card>
          <CardTitle>Past lessons</CardTitle>
          <ul className="divide-y divide-border">
            {sorted.map((d) => (
              <li key={d.id} className="py-2.5 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{d.date}</p>
                  <button className="text-xs text-muted hover:text-danger" onClick={() => remove(d.id)}>Delete</button>
                </div>
                {d.flown.length > 0 && <p className="text-xs text-muted">{d.flown.map((id) => MANEUVERS.find((m) => m.id === id)?.name ?? id).join(" · ")}</p>}
                {d.items.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-xs">
                    {d.items.map((it) => <li key={it.id} className={it.resolved ? "text-muted line-through" : it.rating === "bad" ? "text-danger" : "text-warn"}>{it.text}</li>)}
                  </ul>
                )}
                {d.cfiComments && <p className="mt-1 text-xs italic text-fg/80">&ldquo;{d.cfiComments}&rdquo;</p>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
