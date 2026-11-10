import { defineKey, update } from "./storage";

/** Per-drill history, keyed by review id ("radio:towered-taxi"). Scheduling lives in the srs store, not here. */
export interface DrillRecord {
  attempts: number;
  lastAt: string;
  lastOk: boolean;
  misses: Record<string, number>; // element id -> times missed
}

export const drillLogKey = defineKey<Record<string, DrillRecord>>("drill-log", 1, {});

export function logDrill(id: string, ok: boolean, missed: string[]): void {
  update(drillLogKey, (all) => {
    const prev = all[id] ?? { attempts: 0, lastAt: "", lastOk: false, misses: {} };
    const misses = { ...prev.misses };
    for (const m of missed) misses[m] = (misses[m] ?? 0) + 1;
    return { ...all, [id]: { attempts: prev.attempts + 1, lastAt: new Date().toISOString(), lastOk: ok, misses } };
  });
}
