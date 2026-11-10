import { describe, expect, it } from "vitest";
import { normalize } from "@/lib/radio/normalize";
import { checkCall, gradeDrill, type Slots } from "@/lib/radio/check";
import { slotsFor, shortCallsign } from "@/lib/radio/slots";
import { RADIO_SCRIPTS, modelText, renderModel } from "@/data/radioScripts";
import { RADIO_SCENARIOS, scenarioById } from "@/data/radioScenarios";

const n = (s: string) => normalize(s).join(" ");

describe("normalize", () => {
  it("converges the ways of saying an altitude", () => {
    expect(n("two thousand five hundred")).toBe("2500");
    expect(n("twenty five hundred")).toBe("2500");
    expect(n("2,500")).toBe("2500");
    expect(n("one two thousand five hundred")).toBe("12500");
    expect(n("three thousand")).toBe("3000");
  });
  it("handles radio digits", () => {
    expect(n("wind two one zero at niner")).toBe("wind 210 at 9");
    expect(n("tree fife")).toBe("35");
    expect(n("runway two zero")).toBe("runway 20");
    expect(n("runway twenty")).toBe("runway 20");
    expect(n("runway 20")).toBe("runway 20");
  });
  it("handles frequencies and altimeter settings", () => {
    expect(n("one two one point eight five")).toBe("121.85");
    expect(n("contact ground 121.85.")).toBe("contact ground 121.85");
    expect(n("altimeter three zero zero one")).toBe("altimeter 3001");
  });
  it("converts homophones only between digits", () => {
    expect(n("one to zero")).toBe("120");
    expect(n("climb to 3000")).toBe("climb to 3000");
    expect(n("cleared for takeoff runway two zero")).toBe("cleared for takeoff runway 20");
  });
  it("stops a number at punctuation", () => {
    expect(n("Skyhawk one two three four five, one zero miles south")).toBe("skyhawk 12345 10 miles south");
  });
  it("normalises spelling variants", () => {
    expect(n("Sky Hawk, mid field left down wind, forty-five")).toBe("skyhawk midfield left downwind 45");
    expect(n("a Cessna one seventy two")).toBe("a cessna 172");
  });
});

const slots: Slots = { facility: "Concord Ground", tail: "N12345", atis: "Delta", runway: "20" };
const hit = (text: string, id: string, els = RADIO_SCRIPTS[0].turns[0].expect!.elements) => checkCall(text, els, slots).find((e) => e.id === id)!.hit;

describe("checkCall", () => {
  const full = "Concord Ground, Skyhawk one two three four five, at the FBO ramp with information Delta, request taxi, VFR to the south";
  it("passes a complete initial call, spoken or typed", () => {
    expect(checkCall(full, RADIO_SCRIPTS[0].turns[0].expect!.elements, slots).every((e) => e.hit)).toBe(true);
    expect(checkCall("concord ground skyhawk 12345 at the fbo with delta request taxi to the south", RADIO_SCRIPTS[0].turns[0].expect!.elements, slots).every((e) => e.hit)).toBe(true);
  });
  it("flags a short callsign on initial contact", () => {
    expect(hit("Concord Ground, Skyhawk three four five, FBO ramp, information Delta, taxi", "callsign")).toBe(false);
  });
  it("flags a missing or wrong ATIS letter", () => {
    expect(hit("Concord Ground, Skyhawk 12345 at the ramp, request taxi", "atis")).toBe(false);
    expect(hit("Concord Ground, Skyhawk 12345 at the ramp with information Echo, request taxi", "atis")).toBe(false);
  });
  it("needs the hold short readback and accepts the short callsign after first contact", () => {
    const els = RADIO_SCRIPTS[0].turns[1].expect!.elements;
    const r = checkCall("runway two zero via alpha, three four five", els, slots);
    expect(r.find((e) => e.id === "holdshort")!.hit).toBe(false);
    expect(r.find((e) => e.id === "callsign")!.hit).toBe(true);
    expect(r.find((e) => e.id === "runway")!.hit).toBe(true);
  });
  it("matches a number that ran into the callsign", () => {
    const els = RADIO_SCRIPTS[2].turns[0].expect!.elements;
    const r = checkCall("concord tower skyhawk one two three four five one zero miles south two thousand five hundred information echo landing", els, { ...slots, facility: "Concord Tower", atis: "Echo" });
    expect(r.filter((e) => !e.hit).map((e) => e.id)).toEqual([]);
  });
  it("enforces the CTAF start and end", () => {
    const els = RADIO_SCRIPTS[3].turns[2].expect!.elements;
    const s = { ...slots, facility: "Monroe traffic", runway: "23" };
    expect(checkCall("Monroe traffic, Skyhawk 345, left downwind runway two three, Monroe", els, s).every((e) => e.hit)).toBe(true);
    const r = checkCall("Skyhawk 345 left downwind runway two three", els, s);
    expect(r.find((e) => e.id === "start")!.hit).toBe(false);
    expect(r.find((e) => e.id === "end")!.hit).toBe(false);
  });
  it("tolerates a one-letter speech slip in a long word", () => {
    expect(hit("Concord Ground Skyhawk 12345 at the ramp informaton delta request taxi", "atis")).toBe(true);
  });
});

describe("scripts", () => {
  it("has a script for every scenario", () => {
    expect(RADIO_SCRIPTS.map((s) => s.scenarioId).sort()).toEqual(RADIO_SCENARIOS.map((s) => s.id).sort());
  });
  it("every model call satisfies its own required elements", () => {
    const pilot = { tailNumber: "N12345", callsignSpoken: "Skyhawk one two three four five" };
    for (const script of RADIO_SCRIPTS) {
      const { slots: sl, vars } = slotsFor(scenarioById(script.scenarioId)!, script, pilot);
      for (const t of script.turns) {
        if (!t.expect) { expect(t.selfGrade, `${script.scenarioId}/${t.id}`).toBeTruthy(); continue; }
        const text = modelText(renderModel(t.expect.model, vars));
        const missed = checkCall(text, t.expect.elements, sl).filter((e) => !e.hit).map((e) => e.id);
        expect(missed, `${script.scenarioId}/${t.id}: "${text}"`).toEqual([]);
        // every element is marked somewhere in the model call
        const marked = new Set(renderModel(t.expect.model, vars).map((s) => s.el).filter(Boolean));
        for (const e of t.expect.elements) expect(marked.has(e.id), `${script.scenarioId}/${t.id} marks ${e.id}`).toBe(true);
      }
    }
  });
  it("works with a tail number that has letters", () => {
    expect(shortCallsign("N734SP", "Skyhawk seven three four sierra papa")).toBe("Skyhawk four Sierra Papa");
    const s = { ...slots, tail: "N734SP" };
    const els = RADIO_SCRIPTS[0].turns[1].expect!.elements;
    expect(checkCall("runway two zero via alpha hold short runway two zero skyhawk four sierra papa", els, s).every((e) => e.hit)).toBe(true);
  });
});

describe("gradeDrill", () => {
  const el = (hit: boolean, critical = false, overridden = false) => ({ id: "x", label: "x", hit, critical, overridden });
  it("maps results to a review grade", () => {
    expect(gradeDrill([el(true), el(false, true)], false)).toBe("again");
    expect(gradeDrill([el(true), el(true), el(true), el(false)], false)).toBe("hard");
    expect(gradeDrill([el(true), el(true, false, true)], true)).toBe("hard");
    expect(gradeDrill([el(true), el(true)], false)).toBe("good");
    expect(gradeDrill([el(true), el(true)], true)).toBe("easy");
  });
});
