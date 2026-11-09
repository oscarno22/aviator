"use client";

import { useRef, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/Icon";
import { settingsKey, spokenCallsign, type Settings } from "@/lib/settings";
import { useStored } from "@/lib/useStored";
import { clearAll, exportAll, importAll } from "@/lib/storage";

export default function SettingsForm() {
  const [s, setS] = useStored(settingsKey);
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const patch = (p: Partial<Settings>) => setS((prev) => ({ ...prev, ...p }));

  const onExport = () => {
    const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aviator-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const onImport = async (file: File) => {
    try {
      const n = importAll(JSON.parse(await file.text()));
      setMsg(`Imported ${n} record${n === 1 ? "" : "s"}.`);
    } catch {
      setMsg("That file didn't look like an Aviator backup.");
    }
  };

  return (
    <>
      <PageHeader title="Settings" />
      <div className="space-y-4">
        <Card>
          <CardTitle>Airplane & airports</CardTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tail number" hint={`Spoken: ${spokenCallsign(s.tailNumber)}`}>
              <input className={INPUT} value={s.tailNumber} onChange={(e) => patch({ tailNumber: e.target.value.toUpperCase(), callsignSpoken: spokenCallsign(e.target.value.toUpperCase()) })} />
            </Field>
            <Field label="Training airport (ICAO)" hint="Where he actually flies. Used for radio scenarios and weather.">
              <input className={INPUT} value={s.trainingAirport} onChange={(e) => patch({ trainingAirport: e.target.value.toUpperCase().slice(0, 4) })} />
            </Field>
            <Field label="Home airport (ICAO)" hint="Nearest big METAR station.">
              <input className={INPUT} value={s.homeAirport} onChange={(e) => patch({ homeAirport: e.target.value.toUpperCase().slice(0, 4) })} />
            </Field>
            <Field label="Runway heading (°)" hint="Only used if the training airport isn't one the app knows (KJQF, KEQY, KCLT pick the best runway automatically).">
              <input className={INPUT} type="number" min={0} max={360} value={s.runwayHeading} onChange={(e) => patch({ runwayHeading: Number(e.target.value) })} />
            </Field>
          </div>
        </Card>

        <Card>
          <CardTitle>Voice</CardTitle>
          <label className="flex items-center justify-between py-1.5">
            <span>Read callouts and ATC aloud</span>
            <input type="checkbox" className="h-5 w-5 accent-amber" checked={s.voiceEnabled} onChange={(e) => patch({ voiceEnabled: e.target.checked })} />
          </label>
          <label className="block py-1.5">
            <span className="flex justify-between text-sm"><span>Speech rate</span><span className="tabular text-muted">{s.speechRate.toFixed(2)}×</span></span>
            <input type="range" min={0.7} max={1.3} step={0.05} className="w-full accent-amber" value={s.speechRate} onChange={(e) => patch({ speechRate: Number(e.target.value) })} />
          </label>
        </Card>

        <Card>
          <CardTitle>Sim</CardTitle>
          <label className="flex items-center justify-between py-1.5">
            <span>Panel style</span>
            <select className={INPUT + " w-auto"} value={s.panelStyle} onChange={(e) => patch({ panelStyle: e.target.value as Settings["panelStyle"] })}>
              <option value="sixpack">Round gauges (six-pack)</option>
              <option value="pfd">Glass (G1000-style)</option>
            </select>
          </label>
          <label className="flex items-center justify-between py-1.5">
            <span>Light turbulence</span>
            <input type="checkbox" className="h-5 w-5 accent-amber" checked={s.turbulence} onChange={(e) => patch({ turbulence: e.target.checked })} />
          </label>
        </Card>

        <Card>
          <CardTitle>Radio & oral exam access</CardTitle>
          <Field label="Passcode" hint="Must match APP_PASSCODE on the server. Keeps strangers from using the API key.">
            <input className={INPUT} type="password" autoComplete="off" value={s.passcode} onChange={(e) => patch({ passcode: e.target.value })} />
          </Field>
        </Card>

        <Card>
          <CardTitle>Backup</CardTitle>
          <p className="mb-3 text-sm text-muted">Everything lives in this browser. Export a JSON file to move progress and logbook to another device.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onExport}><Icon name="download" size={16} /> Export</Button>
            <Button onClick={() => fileRef.current?.click()}><Icon name="upload" size={16} /> Import</Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.target.value = ""; }} />
            <Button variant="danger" className="ml-auto" onClick={() => { if (confirm("Erase all Aviator data in this browser?")) { clearAll(); setMsg("Cleared."); } }}>Erase all data</Button>
          </div>
          {msg && <p className="mt-3 text-sm text-amber">{msg}</p>}
        </Card>
      </div>
    </>
  );
}

const INPUT = "w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-amber";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
