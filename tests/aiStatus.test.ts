import { describe, expect, it } from "vitest";
import { afterFailure, DOWN_TTL_MS, isDown, isDownFailure, type AiStatus } from "@/lib/aiStatus";
import { DEFAULT_SETTINGS, settingsKey } from "@/lib/settings";
import { pickOral, suggestGrade } from "@/components/chat/OralBank";
import { ORAL_BANK } from "@/data/oralBank";
import { newProgress } from "@/lib/srs";

describe("ai status", () => {
  const now = new Date("2026-11-09T12:00:00Z");
  it("goes down on failures that will not fix themselves", () => {
    for (const k of ["offline", "billing", "config", "auth", "upstream"] as const) {
      expect(afterFailure({ state: "unknown" }, k, false, now)).toEqual({ state: "down", reason: k, at: now.toISOString() });
    }
  });
  it("stays up on a rate limit, a bad passcode or a mid-reply break", () => {
    const prev: AiStatus = { state: "ok" };
    expect(afterFailure(prev, "rate", false, now)).toBe(prev);
    expect(afterFailure(prev, "passcode", false, now)).toBe(prev);
    expect(afterFailure(prev, "stream", true, now)).toBe(prev);
    expect(isDownFailure("stream", false)).toBe(true);
  });
  it("expires after 24 hours", () => {
    const s: AiStatus = { state: "down", reason: "billing", at: now.toISOString() };
    expect(isDown(s, new Date(now.getTime() + DOWN_TTL_MS - 1000))).toBe(true);
    expect(isDown(s, new Date(now.getTime() + DOWN_TTL_MS + 1000))).toBe(false);
    expect(isDown({ state: "unknown" }, now)).toBe(false);
  });
});

describe("settings migration", () => {
  it("adds aiMode to settings saved by version 1", () => {
    expect(settingsKey.version).toBe(2);
    const v1 = { ...DEFAULT_SETTINGS, tailNumber: "N734SP" } as Record<string, unknown>;
    delete v1.aiMode;
    const migrated = settingsKey.migrate!(v1, 1);
    expect(migrated.aiMode).toBe("auto");
    expect(migrated.tailNumber).toBe("N734SP");
  });
});

describe("oral bank session", () => {
  it("puts due questions first, then unseen ones", () => {
    const [a, b] = ORAL_BANK;
    const srs = {
      [`oral:${a.id}`]: { ...newProgress(`oral:${a.id}`, "2026-11-01"), due: "2026-12-01" },
      [`oral:${b.id}`]: { ...newProgress(`oral:${b.id}`, "2026-11-01"), due: "2026-11-02" },
    };
    const picked = pickOral(ORAL_BANK, srs, "all", 5, "2026-11-09", 0.5);
    expect(picked[0].id).toBe(b.id);
    expect(picked).toHaveLength(5);
    expect(picked.map((q) => q.id)).not.toContain(a.id);
  });
  it("filters by area", () => {
    expect(pickOral(ORAL_BANK, {}, "weather", 50, "2026-11-09", 0.5).every((q) => q.areaId === "weather")).toBe(true);
  });
  it("suggests a grade from ticked key points", () => {
    expect(suggestGrade(0, 3)).toBe("again");
    expect(suggestGrade(1, 3)).toBe("again");
    expect(suggestGrade(2, 3)).toBe("hard");
    expect(suggestGrade(3, 3)).toBe("good");
  });
});
