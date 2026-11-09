"use client";

import { altimeterInHg, cToF, ceilingFt, flightCategory, obsAgeMinutes, tafLines, visibilitySm, windComponents, type MetarJson, type TafJson } from "@/lib/metar";

const CAT_CLS: Record<string, string> = { VFR: "bg-ok/15 text-ok", MVFR: "bg-sky/15 text-sky", IFR: "bg-danger/15 text-danger", LIFR: "bg-danger/25 text-danger" };

/** Runway ends to choose from (magnetic headings); the one with the most headwind is shown. */
export function bestRunway(runways: number[], wdir: number | string | null | undefined, wspd: number | null | undefined): number | undefined {
  if (!runways.length) return undefined;
  if (typeof wdir !== "number" || !wspd) return runways[0];
  return runways.reduce((best, r) => ((windComponents(wdir, wspd, r)?.head ?? -99) > (windComponents(wdir, wspd, best)?.head ?? -99) ? r : best), runways[0]);
}

export default function WeatherCard({ metar, taf, runways, label, compact }: { metar: MetarJson | null; taf?: TafJson | null; runways?: number[]; label: string; compact?: boolean }) {
  if (!metar) return <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">{label}: no observation available.</div>;
  const cat = flightCategory(metar);
  const ceil = ceilingFt(metar);
  const vis = visibilitySm(metar);
  const runwayMag = runways ? bestRunway(runways, metar.wdir, metar.wspd) : undefined;
  const wind = runwayMag != null ? windComponents(metar.wdir, metar.wspd, runwayMag) : null;
  const age = obsAgeMinutes(metar);
  const windText = metar.wdir == null || metar.wspd == null ? "calm" : `${typeof metar.wdir === "number" ? String(metar.wdir).padStart(3, "0") : metar.wdir}° at ${metar.wspd}${metar.wgst ? ` gusting ${metar.wgst}` : ""} kt`;
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{label} <span className="font-normal text-muted">{metar.icaoId}</span></p>
          <p className="text-xs text-muted">{age != null ? `${age} min ago` : ""}{metar.wxString ? ` · ${metar.wxString}` : ""}</p>
        </div>
        <span className={`rounded-md px-2 py-1 text-sm font-bold ${cat ? CAT_CLS[cat] : "bg-surface-2 text-muted"}`}>{cat ?? "?"}</span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm tabular sm:grid-cols-3">
        <Row k="Wind" v={windText} />
        <Row k="Visibility" v={vis != null ? `${vis} SM` : "—"} />
        <Row k="Ceiling" v={ceil != null ? `${ceil.toLocaleString()} ft` : "none"} />
        <Row k="Temp / dew" v={metar.temp != null ? `${metar.temp}° / ${metar.dewp ?? "—"}° C (${cToF(metar.temp)}° F)` : "—"} />
        <Row k="Altimeter" v={altimeterInHg(metar) ?? "—"} />
        {wind && (
          <Row k={`Rwy ${String(Math.round(runwayMag! / 10) || 36).padStart(2, "0")} (best)`}
            v={wind.variable ? `variable, up to ${wind.cross} kt cross` : `${Math.abs(wind.head)} kt ${wind.head >= 0 ? "head" : "TAIL"}wind · ${Math.abs(wind.cross)} kt cross from the ${wind.cross >= 0 ? "right" : "left"}`}
            warn={!wind.variable && (wind.head < 0 || Math.abs(wind.cross) > 10)} />
        )}
      </dl>
      {!compact && (
        <>
          <p className="mt-3 break-words font-mono text-[11px] leading-relaxed text-muted">{metar.rawOb}</p>
          {taf?.rawTAF && (
            <div className="mt-3 border-t border-border pt-2">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">TAF</p>
              {tafLines(taf.rawTAF).map((l, i) => <p key={i} className="break-words font-mono text-[11px] leading-relaxed">{l}</p>)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return <div className="contents"><dt className="text-muted">{k}</dt><dd className={warn ? "text-warn" : ""}>{v}</dd></div>;
}
