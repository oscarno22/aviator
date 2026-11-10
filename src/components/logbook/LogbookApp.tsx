"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EMPTY_ENTRY, logbookKey, requirements, totals, type LogbookEntry } from "@/lib/far61";
import { todayStr } from "@/lib/srs";
import { uid } from "@/lib/storage";
import { useStored } from "@/lib/useStored";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import Icon from "@/components/Icon";
import EntryForm from "./EntryForm";

export default function LogbookApp() {
  const [entries, setEntries] = useStored(logbookKey);
  const [editing, setEditing] = useState<LogbookEntry | null>(null);
  const [adding, setAdding] = useState<"flight" | "carryforward" | null>(null);
  const [justLogged, setJustLogged] = useState<string | null>(null); // date of the flight just added
  const reqs = useMemo(() => requirements(entries), [entries]);
  const t = useMemo(() => totals(entries), [entries]);
  const sorted = useMemo(() => [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)), [entries]);
  const done = reqs.filter((r) => r.value >= r.required).length;

  const save = (entry: LogbookEntry) => {
    setJustLogged(entry.kind === "flight" && !entries.some((e) => e.id === entry.id) ? entry.date : null);
    setEntries((prev) => (prev.some((e) => e.id === entry.id) ? prev.map((e) => (e.id === entry.id ? entry : e)) : [...prev, entry]));
    setEditing(null); setAdding(null);
  };
  const remove = (id: string) => { if (confirm("Delete this entry?")) setEntries((prev) => prev.filter((e) => e.id !== id)); setEditing(null); };

  const groups: { key: "total" | "dual" | "solo"; label: string }[] = [
    { key: "total", label: "Total" }, { key: "dual", label: "With an instructor" }, { key: "solo", label: "Solo" },
  ];

  return (
    <>
      <PageHeader title="Logbook" subtitle={`${t.total.toFixed(1)} h total · ${t.dual.toFixed(1)} dual · ${t.solo.toFixed(1)} solo · ${t.landings} landings`}
        action={<Button variant="primary" onClick={() => setAdding("flight")}><Icon name="check" size={16} /> Log flight</Button>} />

      {(adding || editing) && (
        <EntryForm initial={editing ?? { ...EMPTY_ENTRY, id: uid(), date: todayStr(), kind: adding ?? "flight", flags: {} }}
          onSave={save} onCancel={() => { setEditing(null); setAdding(null); }} onDelete={editing ? () => remove(editing.id) : undefined} />
      )}

      {justLogged && (
        <p className="mb-4 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
          Logged. <Link href={`/debrief?date=${justLogged}`} className="font-medium text-accent underline">Debrief this flight</Link> while it is fresh.
        </p>
      )}

      <Card className="mb-4">
        <CardTitle>Private pilot requirements · {done} of {reqs.length} met</CardTitle>
        {groups.map((g) => (
          <div key={g.key} className="mb-2">
            <p className="mt-2 text-xs font-semibold text-fg/80">{g.label}</p>
            {reqs.filter((r) => r.group === g.key).map((r) => (
              <ProgressBar key={r.id} value={r.value} max={r.required} label={r.label}
                sublabel={r.unit === "hr" ? `${r.value.toFixed(1)} / ${r.required} h` : r.unit === "flight" ? (r.value ? "done" : "not yet") : `${r.value} / ${r.required}`} />
            ))}
          </div>
        ))}
        <p className="mt-2 text-xs text-muted">14 CFR 61.109(a). The 3 hours of checkride prep must fall within the two calendar months before the practical test, so that bar can go back down. Confirm everything against the official logbook and your CFI.</p>
        {entries.length === 0 && (
          <Button className="mt-3" onClick={() => setAdding("carryforward")}>Enter existing hours as one carry-forward row</Button>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle className="mb-0">Entries</CardTitle>
          {entries.length > 0 && <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setAdding("carryforward")}>+ carry-forward</Button>}
        </div>
        {sorted.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No entries yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {sorted.map((e) => (
              <li key={e.id}>
                <button className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:text-accent" onClick={() => { setAdding(null); setEditing(e); }}>
                  <span className="min-w-0">
                    <span className="block text-sm">{e.date} · {e.kind === "carryforward" ? "Carry-forward" : e.route || e.aircraft}{e.tail ? ` · ${e.tail}` : ""}</span>
                    <span className="block truncate text-xs text-muted">{e.total.toFixed(1)} h{e.dual ? ` · dual ${e.dual.toFixed(1)}` : ""}{e.solo ? ` · solo ${e.solo.toFixed(1)}` : ""}{e.night ? ` · night ${e.night.toFixed(1)}` : ""}{e.landingsDay + e.landingsNight ? ` · ${e.landingsDay + e.landingsNight} ldg` : ""}{e.remarks ? ` · ${e.remarks}` : ""}</span>
                  </span>
                  <Icon name="chevron" size={16} className="shrink-0 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
