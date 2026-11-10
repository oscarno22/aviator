import { alnumRuns, digitsOf, findPhrase, normalize, PHONETIC } from "./normalize";

/** What a required part of a call looks like. All text is compared after normalize(). */
export type Matcher =
  | { slot: "facility" | "callsign" | "callsignFull" | "atis" | "runway" }
  | { phrase: string[] }                 // any one of these phrases
  | { number: string | string[] }        // digits, e.g. "2500", "121.85", "3001"
  | { starts: string[] }                 // the call begins with one of these
  | { ends: string[] }                   // the call ends with one of these
  | { all: Matcher[] };

export interface RequiredElement {
  id: string;
  label: string;        // shown in the checklist: "ATIS letter"
  match: Matcher;
  critical?: boolean;   // missing it fails the call
  hint?: string;        // shown when missed
}

/** Values the slots resolve to for one scenario and one pilot. */
export interface Slots {
  facility: string;     // "Concord Ground"
  tail: string;         // "N12345"
  atis?: string;        // "Delta"
  runway?: string;      // "20"
}

export interface ElementResult { id: string; label: string; hit: boolean; critical: boolean; hint?: string }

const tailBody = (tail: string) => tail.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/^n(?=\d)/, "");

function hasNumber(tokens: string[], want: string, slots: Slots): boolean {
  const w = digitsOf(want);
  if (!w) return false;
  const last3 = tailBody(slots.tail).slice(-3);
  return tokens.some((t) => {
    if (!/\d/.test(t)) return false;
    const d = digitsOf(t);
    if (d === w) return true;
    // "...three four five one zero miles" typed without a comma runs the callsign into the number.
    return d.length > w.length && d.endsWith(w) && !!last3 && d.slice(0, -w.length).endsWith(last3);
  });
}

export function matches(m: Matcher, tokens: string[], slots: Slots): boolean {
  if ("all" in m) return m.all.every((x) => matches(x, tokens, slots));
  if ("phrase" in m) return m.phrase.some((p) => findPhrase(tokens, normalize(p)) >= 0);
  if ("number" in m) return (Array.isArray(m.number) ? m.number : [m.number]).some((n) => hasNumber(tokens, n, slots));
  if ("starts" in m) return m.starts.some((p) => { const at = findPhrase(tokens, normalize(p)); return at >= 0 && at <= 1; });
  if ("ends" in m) return m.ends.some((p) => { const want = normalize(p); const at = findPhrase(tokens.slice(-(want.length + 1)), want); return at >= 0; });
  switch (m.slot) {
    case "facility": return findPhrase(tokens, normalize(slots.facility)) >= 0;
    case "callsign":
    case "callsignFull": {
      const body = tailBody(slots.tail);
      if (!body) return false;
      const want = m.slot === "callsignFull" ? body : body.slice(-3);
      return alnumRuns(tokens).some((r) => r.includes(want));
    }
    case "atis": {
      if (!slots.atis) return false;
      const word = slots.atis.toLowerCase();
      const letter = PHONETIC[word] ?? word;
      return tokens.some((t, i) => t === word || (t === letter && ["information", "info", "with", "atis"].includes(tokens[i - 1] ?? "")));
    }
    case "runway": {
      if (!slots.runway) return false;
      const want = digitsOf(slots.runway);
      return tokens.some((t, i) => t === "runway" && digitsOf(tokens[i + 1] ?? "") === want);
    }
  }
}

export function checkCall(text: string, elements: RequiredElement[], slots: Slots): ElementResult[] {
  const tokens = normalize(text);
  return elements.map((e) => ({ id: e.id, label: e.label, critical: !!e.critical, hint: e.hint, hit: matches(e.match, tokens, slots) }));
}

export type DrillGrade = "again" | "hard" | "good" | "easy";

/** One grade for a whole scenario, from every element of every call. `overridden` = "I said it" was used. */
export function gradeDrill(results: (ElementResult & { overridden?: boolean })[], previousRunClean: boolean): DrillGrade {
  if (results.length === 0) return "good";
  const missed = results.filter((r) => !r.hit);
  const hitRatio = 1 - missed.length / results.length;
  if (missed.some((r) => r.critical) || hitRatio < 0.7) return "again";
  if (missed.length > 0 || results.some((r) => r.overridden)) return "hard";
  return previousRunClean ? "easy" : "good";
}
