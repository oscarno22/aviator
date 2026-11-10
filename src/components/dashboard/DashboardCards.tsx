"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CONCEPTS } from "@/data/concepts";
import { logbookKey, requirements } from "@/lib/far61";
import { settingsKey } from "@/lib/settings";
import { simResultsKey } from "@/lib/simResults";
import { srsKey, customCardsKey, dueCount } from "@/lib/srsStore";
import { useStored, useHydrated } from "@/lib/useStored";
import { useWeather } from "@/lib/useWeather";
import { airportById } from "@/data/airports";
import { Card, CardTitle } from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import WeatherCard from "@/components/weather/WeatherCard";
import Icon from "@/components/Icon";
import { useReviewQueue } from "@/components/review/ReviewApp";
import { queueSummary } from "@/lib/reviewQueue";

export default function DashboardCards() {
  const hydrated = useHydrated();
  const [s] = useStored(settingsKey);
  const [srs] = useStored(srsKey);
  const [custom] = useStored(customCardsKey);
  const [results] = useStored(simResultsKey);
  const [entries] = useStored(logbookKey);
  const due = useMemo(() => dueCount(srs, [...CONCEPTS, ...custom]), [srs, custom]);
  const queue = queueSummary(useReviewQueue());
  const reqs = useMemo(() => requirements(entries), [entries]);
  const { data } = useWeather([s.trainingAirport]);
  const metar = data?.metars.find((m) => m.icaoId === s.trainingAirport) ?? null;
  const met = reqs.filter((r) => r.value >= r.required).length;
  const headline = reqs.filter((r) => ["total", "dual", "solo"].includes(r.id));

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card>
        <CardTitle>Today</CardTitle>
        <div className="flex items-center justify-between gap-3">
          <Link href="/review" className="min-w-0">
            <p className="text-2xl font-semibold tabular">{hydrated ? queue.open : "–"} <span className="text-sm font-normal text-muted">to review</span></p>
            <p className="truncate text-xs text-muted">{hydrated ? `${due.due} cards · ${queue.byKind.debrief} from lessons · ${queue.byKind.oral + queue.byKind.radio + queue.byKind.sim} drills` : ""}</p>
          </Link>
          <Link href="/review?warmup=1" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg"><Icon name="play" size={14} /> Warm up</Link>
        </div>
        <div className="mt-3 flex gap-4 text-xs">
          <Link href="/debrief" className="text-accent">Debrief a lesson →</Link>
          <Link href="/quiz?mode=pop" className="text-accent">Pop quiz me →</Link>
        </div>
      </Card>

      <Card>
        <CardTitle>Toward the certificate · {hydrated ? `${met} of ${reqs.length}` : ""}</CardTitle>
        {headline.map((r) => <ProgressBar key={r.id} value={r.value} max={r.required} label={r.label} sublabel={`${r.value.toFixed(1)} / ${r.required} h`} />)}
        <Link href="/logbook" className="mt-1 inline-block text-xs text-accent">All requirements →</Link>
      </Card>

      <Card>
        <CardTitle>Last sim tasks</CardTitle>
        {!hydrated || results.length === 0 ? (
          <p className="text-sm text-muted">No tasks flown yet. <Link href="/sim" className="text-accent">Open the sim →</Link></p>
        ) : (
          <ul className="space-y-1 text-sm">
            {results.slice(0, 4).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{r.title}</span>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${r.pass ? "bg-ok/15 text-ok" : "bg-danger/15 text-danger"}`}>{r.pass ? "PASS" : "NOT YET"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {hydrated && <WeatherCard label="Training airport" metar={metar} runways={airportById(s.trainingAirport)?.runways.map((r) => r.magHeading) ?? [s.runwayHeading]} compact />}
    </div>
  );
}
