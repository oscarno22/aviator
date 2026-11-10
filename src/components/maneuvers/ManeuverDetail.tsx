"use client";

import Link from "next/link";
import { useState } from "react";
import type { Maneuver } from "@/data/maneuvers";
import { checklistById } from "@/data/checklists";
import { Card, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/Icon";
import ChairFly from "./ChairFly";

export default function ManeuverDetail({ maneuver: m }: { maneuver: Maneuver }) {
  const [flying, setFlying] = useState(false);
  const entry = Object.entries(m.entry).filter(([, v]) => v) as [string, string][];
  const LABEL: Record<string, string> = { altitude: "Altitude", airspeed: "Airspeed", config: "Configuration", power: "Power", other: "Notes" };

  return (
    <div>
      <Link href="/maneuvers" className="text-xs text-muted hover:text-fg">← Maneuvers</Link>
      <div className="mt-1 mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{m.name}</h1>
          <p className="mt-1 text-sm text-muted">{m.area} · {m.acsRef}</p>
        </div>
        <Button variant="primary" onClick={() => setFlying(true)}><Icon name="play" size={16} /> Chair-fly</Button>
      </div>

      <p className="mb-4 text-fg/90">{m.objective}</p>

      <div className="space-y-4">
        {entry.length > 0 && (
          <Card>
            <CardTitle>Entry</CardTitle>
            <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
              {entry.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{LABEL[k] ?? k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}

        <Card>
          <CardTitle>Procedure</CardTitle>
          <ol className="space-y-3">
            {m.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs text-muted tabular">{i + 1}</span>
                <div className="text-sm">
                  <p>{s.action}</p>
                  {(s.callout || s.target) && (
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      {s.callout && <span className="text-accent">&ldquo;{s.callout}&rdquo;</span>}
                      {s.target && <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-muted">{s.target}</span>}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <CardTitle>ACS standards</CardTitle>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {m.tolerances.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </Card>

        <Card>
          <CardTitle>Common errors</CardTitle>
          <ul className="list-disc space-y-1 pl-5 text-sm text-fg/90">
            {m.commonErrors.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </Card>

        {(m.simTaskId || m.checklistIds?.length) && (
          <div className="flex flex-wrap gap-2">
            {m.simTaskId && (
              <Link href={`/sim?task=${m.simTaskId}`} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-2">
                <Icon name="gauge" size={16} className="text-accent" /> Fly it in the sim
              </Link>
            )}
            {m.checklistIds?.map((id) => {
              const c = checklistById(id);
              return c ? (
                <Link key={id} href={`/checklists/${id}`} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm hover:bg-surface-2">
                  <Icon name="list" size={16} className="text-muted" /> {c.title}
                </Link>
              ) : null;
            })}
          </div>
        )}
        {m.notes && <p className="text-xs text-muted">{m.notes}</p>}
      </div>

      {flying && <ChairFly maneuver={m} onClose={() => setFlying(false)} />}
    </div>
  );
}
