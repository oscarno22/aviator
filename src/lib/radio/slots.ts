import type { RadioScenario } from "@/data/radioScenarios";
import type { RadioScript } from "@/data/radioScripts";
import type { Slots } from "./check";

const WORDS: Record<string, string> = {
  "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five", "6": "six", "7": "seven", "8": "eight", "9": "niner",
  a: "Alpha", b: "Bravo", c: "Charlie", d: "Delta", e: "Echo", f: "Foxtrot", g: "Golf", h: "Hotel", i: "India", j: "Juliet", k: "Kilo",
  l: "Lima", m: "Mike", n: "November", o: "Oscar", p: "Papa", q: "Quebec", r: "Romeo", s: "Sierra", t: "Tango", u: "Uniform",
  v: "Victor", w: "Whiskey", x: "X-ray", y: "Yankee", z: "Zulu",
};

/** "Skyhawk three four five": the abbreviated callsign ATC uses after first contact. */
export function shortCallsign(tail: string, spokenFull: string): string {
  const type = spokenFull.trim().split(/\s+/)[0] || "Skyhawk";
  const last3 = tail.toLowerCase().replace(/[^a-z0-9]/g, "").slice(-3);
  return `${type} ${last3.split("").map((c) => WORDS[c] ?? c).join(" ")}`;
}

export function slotsFor(scenario: RadioScenario, script: RadioScript, pilot: { tailNumber: string; callsignSpoken: string }): { slots: Slots; vars: Record<string, string> } {
  // "Concord Tower (light signals)" -> "Concord Tower"
  const facility = scenario.facility.replace(/\s*\(.*\)$/, "");
  return {
    slots: { facility, tail: pilot.tailNumber, atis: script.atis, runway: script.runway },
    vars: { callsign: pilot.callsignSpoken, callsignShort: shortCallsign(pilot.tailNumber, pilot.callsignSpoken) },
  };
}
