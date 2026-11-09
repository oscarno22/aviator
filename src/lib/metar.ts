/** Decoding helpers for aviationweather.gov JSON METAR/TAF responses. */
import { defineKey } from "./storage";

export interface MetarJson {
  icaoId: string; obsTime?: number; reportTime?: string; rawOb?: string;
  temp?: number | null; dewp?: number | null; wdir?: number | string | null; wspd?: number | null; wgst?: number | null;
  visib?: number | string | null; altim?: number | null; fltCat?: string | null; wxString?: string | null;
  clouds?: { cover: string; base?: number | null }[];
  name?: string;
}
export interface TafJson { icaoId: string; rawTAF?: string; issueTime?: string; validTimeFrom?: number; validTimeTo?: number }
export interface WeatherResponse { metars: MetarJson[]; tafs: TafJson[]; fetchedAt: string }

export type FlightCategory = "VFR" | "MVFR" | "IFR" | "LIFR";

export const weatherCacheKey = defineKey<WeatherResponse | null>("weather-cache", 1, null);

/** Lowest broken/overcast/obscured layer in feet AGL, or null. */
export function ceilingFt(m: MetarJson): number | null {
  const bases = (m.clouds ?? []).filter((c) => ["BKN", "OVC", "OVX", "VV"].includes(c.cover) && c.base != null).map((c) => c.base as number);
  return bases.length ? Math.min(...bases) : null;
}

export function visibilitySm(m: MetarJson): number | null {
  const v = m.visib;
  if (v == null) return null;
  if (typeof v === "number") return v;
  const s = String(v).replace("+", "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

export function flightCategory(m: MetarJson): FlightCategory | null {
  const known = (m.fltCat ?? "").toUpperCase();
  if (["VFR", "MVFR", "IFR", "LIFR"].includes(known)) return known as FlightCategory;
  const c = ceilingFt(m), v = visibilitySm(m);
  if (c == null && v == null) return null;
  const cc = c ?? 99999, vv = v ?? 99;
  if (cc < 500 || vv < 1) return "LIFR";
  if (cc < 1000 || vv < 3) return "IFR";
  if (cc <= 3000 || vv <= 5) return "MVFR";
  return "VFR";
}

/** Headwind (+) / tailwind (−) and crosswind (+ from the right) components in knots. */
export function windComponents(wdir: number | string | null | undefined, wspd: number | null | undefined, runwayMag: number): { head: number; cross: number; variable: boolean } | null {
  if (wspd == null) return null;
  if (wdir == null || wdir === "VRB" || typeof wdir !== "number") return { head: 0, cross: wspd, variable: true };
  const rel = ((wdir - runwayMag + 540) % 360) - 180;
  const rad = (rel * Math.PI) / 180;
  return { head: Math.round(wspd * Math.cos(rad)), cross: Math.round(wspd * Math.sin(rad)), variable: false };
}

export function altimeterInHg(m: MetarJson): string | null {
  if (m.altim == null) return null;
  const inHg = m.altim > 200 ? m.altim * 0.02953 : m.altim; // hPa → inHg when needed
  return inHg.toFixed(2);
}

export function cToF(c: number): number { return Math.round((c * 9) / 5 + 32); }

/** Split a raw TAF into one line per forecast group so it reads like a briefing. */
export function tafLines(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.replace(/\s+/g, " ").split(/\s(?=(?:FM\d{6}|TEMPO|BECMG|PROB\d{2}))/).map((s) => s.trim()).filter(Boolean);
}

export function obsAgeMinutes(m: MetarJson, now = Date.now()): number | null {
  if (!m.obsTime) return null;
  return Math.round((now / 1000 - m.obsTime) / 60);
}
