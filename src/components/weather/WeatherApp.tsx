"use client";

import Link from "next/link";
import { settingsKey } from "@/lib/settings";
import { useStored } from "@/lib/useStored";
import { useWeather } from "@/lib/useWeather";
import { airportById } from "@/data/airports";
import PageHeader from "@/components/ui/PageHeader";
import WeatherCard from "./WeatherCard";

export default function WeatherApp() {
  const [s] = useStored(settingsKey);
  const ids = [s.trainingAirport, s.homeAirport].filter((x, i, a) => x && a.indexOf(x) === i);
  const { data, error, loading, stale } = useWeather(ids);
  const find = (id: string) => data?.metars.find((m) => m.icaoId === id) ?? null;
  const taf = (id: string) => data?.tafs.find((t) => t.icaoId === id) ?? null;
  return (
    <>
      <PageHeader title="Weather" subtitle={<>METAR and TAF from aviationweather.gov. Airports and runway come from <Link href="/settings" className="underline">Settings</Link>.</>} />
      {loading && !data && <p className="text-sm text-muted">Loading…</p>}
      {error && <p className="mb-3 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">{stale ? "Offline: showing the last observation you loaded." : error}</p>}
      <div className="space-y-3">
        {ids.map((id, i) => (
          <WeatherCard key={id} label={i === 0 ? "Training airport" : "Home airport"} metar={find(id)} taf={taf(id)} runways={airportById(id)?.runways.map((r) => r.magHeading) ?? (i === 0 ? [s.runwayHeading] : undefined)} />
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">Not a briefing. Get a real one (1800wxbrief.com or Flight Service) before you fly. VFR minimums: 3 SM and 1,000 ft ceiling in controlled airspace; your personal minimums should be higher.</p>
    </>
  );
}
