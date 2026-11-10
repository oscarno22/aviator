import { defineKey } from "./storage";

export interface Settings {
  homeAirport: string;      // ICAO, for weather (KCLT)
  trainingAirport: string;  // ICAO, where he actually flies (KJQF)
  runwayHeading: number;    // magnetic, for crosswind component
  tailNumber: string;       // e.g. N12345 — used in radio calls
  voiceEnabled: boolean;
  speechRate: number;       // 0.7 – 1.3
  passcode: string;         // x-app-key for /api/chat
  panelStyle: "sixpack" | "pfd";
  turbulence: boolean;
  callsignSpoken: string;   // "Skyhawk one two three four five"
  aiMode: "auto" | "off";   // "off": Radio and Oral always use the scripted drills
}

export const DEFAULT_SETTINGS: Settings = {
  homeAirport: "KCLT",
  trainingAirport: "KJQF",
  runwayHeading: 196,
  tailNumber: "N12345",
  voiceEnabled: true,
  speechRate: 1.0,
  passcode: "",
  panelStyle: "sixpack",
  turbulence: false,
  callsignSpoken: "Skyhawk one two three four five",
  aiMode: "auto",
};

export const settingsKey = defineKey<Settings>("settings", 2, DEFAULT_SETTINGS, (old) => ({
  ...DEFAULT_SETTINGS,
  ...(old as Partial<Settings>),
}));

/** Spell a tail number the way it's spoken on the radio. */
export function spokenCallsign(tail: string, type = "Skyhawk"): string {
  const words: Record<string, string> = {
    "0": "zero", "1": "one", "2": "two", "3": "tree", "4": "four", "5": "fife",
    "6": "six", "7": "seven", "8": "eight", "9": "niner",
  };
  const alpha: Record<string, string> = {
    A: "alpha", B: "bravo", C: "charlie", D: "delta", E: "echo", F: "foxtrot", G: "golf", H: "hotel",
    I: "india", J: "juliet", K: "kilo", L: "lima", M: "mike", N: "november", O: "oscar", P: "papa",
    Q: "quebec", R: "romeo", S: "sierra", T: "tango", U: "uniform", V: "victor", W: "whiskey",
    X: "x-ray", Y: "yankee", Z: "zulu",
  };
  const body = tail.toUpperCase().replace(/^N/, "");
  const spelled = body.split("").map((ch) => words[ch] ?? alpha[ch] ?? ch).join(" ");
  return `${type} ${spelled}`;
}
