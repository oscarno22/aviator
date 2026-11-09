"use client";

import { useState } from "react";
import type { LogbookEntry } from "@/lib/far61";
import { Card, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const INPUT = "w-full rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-sm outline-none focus:border-amber tabular";

const HOURS: { k: keyof LogbookEntry; label: string }[] = [
  { k: "total", label: "Total" }, { k: "dual", label: "Dual received" }, { k: "solo", label: "Solo" }, { k: "pic", label: "PIC" },
  { k: "xcDual", label: "XC dual" }, { k: "xcSolo", label: "XC solo" }, { k: "night", label: "Night" }, { k: "nightDual", label: "Night dual" },
  { k: "simInstrument", label: "Hood (sim. instr.)" }, { k: "actualInstrument", label: "Actual instrument" },
];
const COUNTS: { k: keyof LogbookEntry; label: string }[] = [
  { k: "landingsDay", label: "Day landings" }, { k: "landingsNight", label: "Night landings" },
  { k: "nightFullStopLandings", label: "Night full-stop (dual)" }, { k: "toweredFullStopLandingsSolo", label: "Towered full-stop (solo)" },
];

export default function EntryForm({ initial, onSave, onCancel, onDelete }: { initial: LogbookEntry; onSave: (e: LogbookEntry) => void; onCancel: () => void; onDelete?: () => void }) {
  const [e, setE] = useState<LogbookEntry>(initial);
  const num = (k: keyof LogbookEntry) => (ev: React.ChangeEvent<HTMLInputElement>) => setE({ ...e, [k]: Math.max(0, Number(ev.target.value) || 0) });
  const flag = (k: keyof LogbookEntry["flags"]) => (ev: React.ChangeEvent<HTMLInputElement>) => setE({ ...e, flags: { ...e.flags, [k]: ev.target.checked } });
  return (
    <Card className="mb-4 border-amber/40">
      <CardTitle>{e.kind === "carryforward" ? "Carry-forward totals" : onDelete ? "Edit flight" : "Log a flight"}</CardTitle>
      <form className="space-y-3" onSubmit={(ev) => { ev.preventDefault(); onSave(e); }}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="text-xs text-muted">Date<input type="date" className={INPUT} value={e.date} onChange={(ev) => setE({ ...e, date: ev.target.value })} required /></label>
          <label className="text-xs text-muted">Aircraft<input className={INPUT} value={e.aircraft} onChange={(ev) => setE({ ...e, aircraft: ev.target.value })} /></label>
          <label className="text-xs text-muted">Tail<input className={INPUT} value={e.tail ?? ""} onChange={(ev) => setE({ ...e, tail: ev.target.value.toUpperCase() })} /></label>
          <label className="text-xs text-muted">Route<input className={INPUT} placeholder="KJQF-KEQY-KJQF" value={e.route ?? ""} onChange={(ev) => setE({ ...e, route: ev.target.value.toUpperCase() })} /></label>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {HOURS.map(({ k, label }) => (
            <label key={k} className="text-xs text-muted">{label}<input type="number" inputMode="decimal" step="0.1" min="0" className={INPUT} value={e[k] as number} onChange={num(k)} /></label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {COUNTS.map(({ k, label }) => (
            <label key={k} className="text-xs text-muted">{label}<input type="number" inputMode="numeric" step="1" min="0" className={INPUT} value={e[k] as number} onChange={num(k)} /></label>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-amber" checked={!!e.flags.nightXc100nm} onChange={flag("nightXc100nm")} /> Night XC over 100 nm (dual)</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-amber" checked={!!e.flags.soloXc150nm} onChange={flag("soloXc150nm")} /> Solo 150 nm XC, 3 full stops, 50 nm leg</label>
          <label className="flex items-center gap-1.5"><input type="checkbox" className="accent-amber" checked={!!e.flags.checkridePrep} onChange={flag("checkridePrep")} /> Checkride prep lesson</label>
        </div>
        <label className="block text-xs text-muted">Remarks<input className={INPUT} value={e.remarks ?? ""} onChange={(ev) => setE({ ...e, remarks: ev.target.value })} placeholder="Steep turns, power-off stalls, 3 landings" /></label>
        <div className="flex gap-2">
          <Button type="submit" variant="primary">Save</Button>
          <Button type="button" onClick={onCancel}>Cancel</Button>
          {onDelete && <Button type="button" variant="danger" className="ml-auto" onClick={onDelete}>Delete</Button>}
        </div>
      </form>
    </Card>
  );
}
