import { describe, expect, it } from "vitest";
import { ORAL_BANK, ORAL_BANK_GENERAL, oralByArea } from "@/data/oralBank";
import { ORAL_BANK_LOCAL } from "@/data/oralBank.local";
import { ORAL_AREAS } from "@/data/oralTopics";

describe("oral bank", () => {
  it("ids are unique", () => {
    const ids = ORAL_BANK.map((q) => q.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it("ids are kebab-case and prefixed by their area id", () => {
    for (const q of ORAL_BANK) {
      expect(q.id, q.id).toMatch(/^[a-z0-9-]+$/);
      expect(q.id.startsWith(`${q.areaId}-`), q.id).toBe(true);
    }
  });

  it("every areaId exists in ORAL_AREAS", () => {
    const areaIds = new Set(ORAL_AREAS.map((a) => a.id));
    for (const q of ORAL_BANK) expect(areaIds.has(q.areaId), q.id).toBe(true);
  });

  it("every area has at least 5 questions", () => {
    for (const area of ORAL_AREAS) {
      expect(oralByArea(area.id).length, area.id).toBeGreaterThanOrEqual(5);
    }
  });

  it("q, answer and ref are non-empty", () => {
    for (const q of ORAL_BANK) {
      expect(q.q.trim().length, q.id).toBeGreaterThan(0);
      expect(q.answer.trim().length, q.id).toBeGreaterThan(0);
      expect(q.ref.trim().length, q.id).toBeGreaterThan(0);
      if (q.followUp) {
        expect(q.followUp.q.trim().length, q.id).toBeGreaterThan(0);
        expect(q.followUp.answer.trim().length, q.id).toBeGreaterThan(0);
      }
    }
  });

  it("each question has 2-5 non-empty key points", () => {
    for (const q of ORAL_BANK) {
      expect(q.keyPoints.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.keyPoints.length, q.id).toBeLessThanOrEqual(5);
      for (const k of q.keyPoints) expect(k.trim().length, q.id).toBeGreaterThan(0);
    }
  });

  it("local flag is set only on the local bank, and nothing is pre-verified", () => {
    for (const q of ORAL_BANK_GENERAL) expect(q.local, q.id).toBeUndefined();
    for (const q of ORAL_BANK_LOCAL) expect(q.local, q.id).toBe(true);
    for (const q of ORAL_BANK) expect(q.verified, q.id).toBeUndefined();
  });

  it("the combined bank is general plus local", () => {
    expect(ORAL_BANK.length).toBe(ORAL_BANK_GENERAL.length + ORAL_BANK_LOCAL.length);
  });
});
