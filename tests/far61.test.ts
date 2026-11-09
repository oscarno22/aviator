import { describe, expect, it } from "vitest";
import { EMPTY_ENTRY, checkridePrepHours, requirements, type LogbookEntry } from "@/lib/far61";

const e = (p: Partial<LogbookEntry>): LogbookEntry => ({ id: Math.random().toString(36).slice(2), date: "2026-09-01", ...EMPTY_ENTRY, flags: {}, ...p });

describe("61.109(a) requirements", () => {
  it("sums hours across entries and a carry-forward row", () => {
    const entries = [
      e({ kind: "carryforward", total: 22.5, dual: 18, solo: 4.5, xcDual: 2, nightDual: 1.5, simInstrument: 1, nightFullStopLandings: 4 }),
      e({ total: 1.4, dual: 1.4, xcDual: 1.4 }),
      e({ total: 1.1, solo: 1.1, xcSolo: 1.1, toweredFullStopLandingsSolo: 3, flags: { soloXc150nm: true } }),
    ];
    const req = Object.fromEntries(requirements(entries).map((r) => [r.id, r]));
    expect(req.total.value).toBe(25);
    expect(req.dual.value).toBe(19.4);
    expect(req.xcDual.value).toBe(3.4);
    expect(req.solo.value).toBe(5.6);
    expect(req.xcSolo.value).toBe(1.1);
    expect(req.soloXc150.value).toBe(1);
    expect(req.towered.value).toBe(3);
    expect(req.nightLandings.value).toBe(4);
    expect(req.instrument.value).toBe(1);
    expect(req.nightXc.value).toBe(0);
  });

  it("counts checkride prep only in the last two calendar months", () => {
    const asOf = new Date(2026, 8, 25); // Sept 25
    const entries = [
      e({ date: "2026-06-30", dual: 1.5, flags: { checkridePrep: true } }), // too old
      e({ date: "2026-07-01", dual: 1.2, flags: { checkridePrep: true } }),
      e({ date: "2026-09-20", dual: 1.0, flags: { checkridePrep: true } }),
      e({ date: "2026-09-21", dual: 1.0 }), // not flagged
    ];
    expect(checkridePrepHours(entries, asOf)).toBe(2.2);
  });
});
