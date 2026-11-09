/**
 * 14 CFR 61.109(a): aeronautical experience for a private pilot certificate,
 * airplane single-engine, computed from logbook entries.
 */
import { defineKey } from "./storage";

export interface LogbookEntry {
  id: string;
  date: string;                 // YYYY-MM-DD
  kind: "flight" | "carryforward";
  aircraft: string;
  tail?: string;
  route?: string;
  total: number;
  dual: number;
  solo: number;
  pic: number;
  xcDual: number;
  xcSolo: number;
  night: number;
  nightDual: number;
  simInstrument: number;        // hood time with an instructor
  actualInstrument: number;
  landingsDay: number;
  landingsNight: number;
  nightFullStopLandings: number;
  toweredFullStopLandingsSolo: number;
  flags: { nightXc100nm?: boolean; soloXc150nm?: boolean; checkridePrep?: boolean };
  remarks?: string;
}

export const logbookKey = defineKey<LogbookEntry[]>("logbook", 1, []);

export const EMPTY_ENTRY: Omit<LogbookEntry, "id" | "date"> = {
  kind: "flight", aircraft: "C172S", tail: "", route: "",
  total: 0, dual: 0, solo: 0, pic: 0, xcDual: 0, xcSolo: 0, night: 0, nightDual: 0,
  simInstrument: 0, actualInstrument: 0, landingsDay: 0, landingsNight: 0,
  nightFullStopLandings: 0, toweredFullStopLandingsSolo: 0, flags: {}, remarks: "",
};

export interface Requirement {
  id: string;
  label: string;
  cite: string;
  required: number;
  value: number;
  unit: "hr" | "landings" | "flight";
  group: "total" | "dual" | "solo";
  note?: string;
}

const sum = (entries: LogbookEntry[], k: keyof LogbookEntry) => entries.reduce((a, e) => a + (Number(e[k]) || 0), 0);
const r1 = (x: number) => Math.round(x * 10) / 10;

/** Dual hours logged on entries flagged as checkride prep within the two calendar months before `asOf`. */
export function checkridePrepHours(entries: LogbookEntry[], asOf = new Date()): number {
  const y = asOf.getFullYear(), m = asOf.getMonth();
  const start = new Date(y, m - 2, 1);
  const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
  return r1(entries.filter((e) => e.flags.checkridePrep && e.date >= startStr).reduce((a, e) => a + e.dual, 0));
}

export function requirements(entries: LogbookEntry[], asOf = new Date()): Requirement[] {
  const instrument = r1(sum(entries, "simInstrument") + sum(entries, "actualInstrument"));
  return [
    { id: "total", label: "Total flight time", cite: "61.109(a)", required: 40, value: r1(sum(entries, "total")), unit: "hr", group: "total" },
    { id: "dual", label: "Training from an instructor", cite: "61.109(a)", required: 20, value: r1(sum(entries, "dual")), unit: "hr", group: "dual" },
    { id: "xcDual", label: "Cross-country training", cite: "61.109(a)(1)", required: 3, value: r1(sum(entries, "xcDual")), unit: "hr", group: "dual" },
    { id: "nightDual", label: "Night training", cite: "61.109(a)(2)", required: 3, value: r1(sum(entries, "nightDual")), unit: "hr", group: "dual" },
    { id: "nightXc", label: "One night cross-country over 100 nm", cite: "61.109(a)(2)(i)", required: 1, value: entries.some((e) => e.flags.nightXc100nm) ? 1 : 0, unit: "flight", group: "dual" },
    { id: "nightLandings", label: "Night full-stop landings (pattern, with instructor)", cite: "61.109(a)(2)(ii)", required: 10, value: sum(entries, "nightFullStopLandings"), unit: "landings", group: "dual" },
    { id: "instrument", label: "Flight solely by reference to instruments", cite: "61.109(a)(3)", required: 3, value: instrument, unit: "hr", group: "dual" },
    { id: "prep", label: "Checkride prep within the preceding 2 calendar months", cite: "61.109(a)(4)", required: 3, value: checkridePrepHours(entries, asOf), unit: "hr", group: "dual", note: "Flag those lessons as checkride prep; only the last two calendar months count." },
    { id: "solo", label: "Solo flight time", cite: "61.109(a)(5)", required: 10, value: r1(sum(entries, "solo")), unit: "hr", group: "solo" },
    { id: "xcSolo", label: "Solo cross-country", cite: "61.109(a)(5)(i)", required: 5, value: r1(sum(entries, "xcSolo")), unit: "hr", group: "solo" },
    { id: "soloXc150", label: "One solo cross-country of 150 nm with 3 full-stop landings and a 50 nm leg", cite: "61.109(a)(5)(ii)", required: 1, value: entries.some((e) => e.flags.soloXc150nm) ? 1 : 0, unit: "flight", group: "solo" },
    { id: "towered", label: "Solo full-stop takeoffs and landings at a towered airport", cite: "61.109(a)(5)(iii)", required: 3, value: sum(entries, "toweredFullStopLandingsSolo"), unit: "landings", group: "solo" },
  ];
}

export function totals(entries: LogbookEntry[]) {
  return {
    total: r1(sum(entries, "total")), dual: r1(sum(entries, "dual")), solo: r1(sum(entries, "solo")), pic: r1(sum(entries, "pic")),
    night: r1(sum(entries, "night")), xc: r1(sum(entries, "xcDual") + sum(entries, "xcSolo")),
    landings: sum(entries, "landingsDay") + sum(entries, "landingsNight"),
  };
}
