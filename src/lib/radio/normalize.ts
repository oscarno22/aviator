/**
 * Turns a spoken or typed radio call into comparable tokens, so
 * "two thousand five hundred", "twenty five hundred" and "2,500" all become "2500",
 * and "niner", "tree", "fife" become digits. Pure; no browser APIs.
 */
const DIGITS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", tree: "3", four: "4", five: "5", fife: "5",
  six: "6", seven: "7", eight: "8", nine: "9", niner: "9",
};
const TEENS: Record<string, number> = {
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
/** What speech-to-text writes when it hears a digit between other digits. */
const HOMOPHONES: Record<string, string> = { to: "2", too: "2", for: "4", fore: "4", ate: "8", won: "1", oh: "0", o: "0" };

export const PHONETIC: Record<string, string> = {
  alpha: "a", bravo: "b", charlie: "c", delta: "d", echo: "e", foxtrot: "f", golf: "g", hotel: "h", india: "i",
  juliet: "j", kilo: "k", lima: "l", mike: "m", november: "n", oscar: "o", papa: "p", quebec: "q", romeo: "r",
  sierra: "s", tango: "t", uniform: "u", victor: "v", whiskey: "w", xray: "x", yankee: "y", zulu: "z",
};
const ALIASES: [RegExp, string][] = [
  [/\balfa\b/g, "alpha"], [/\bjuliett\b/g, "juliet"], [/\bx[- ]ray\b/g, "xray"], [/\bwhisky\b/g, "whiskey"],
  [/\bsky ?hawk\b/g, "skyhawk"], [/\bdown ?wind\b/g, "downwind"], [/\bmid ?field\b/g, "midfield"],
  [/\btake ?off\b/g, "takeoff"], [/\bcentre\b/g, "center"], [/\bo'?clock\b/g, "oclock"],
];

const isDigitTok = (t: string | undefined) => !!t && /^\d$/.test(t);
const isNumeric = (t: string) => /^[\d.]+$/.test(t) && /\d/.test(t);

type NumPart = { kind: "digit" | "teen" | "tens" | "hundred" | "thousand" | "point" | "literal"; v: string };

function numPart(tok: string): NumPart | null {
  if (tok in DIGITS) return { kind: "digit", v: DIGITS[tok] };
  if (/^\d$/.test(tok)) return { kind: "digit", v: tok };
  if (tok in TEENS) return { kind: "teen", v: String(TEENS[tok]) };
  if (tok in TENS) return { kind: "tens", v: String(TENS[tok]) };
  if (tok === "hundred") return { kind: "hundred", v: "" };
  if (tok === "thousand") return { kind: "thousand", v: "" };
  if (tok === "point" || tok === "decimal") return { kind: "point", v: "." };
  return null;
}

/** Collapse one run of number words. Plain digit strings concatenate; anything with tens/hundred/thousand is arithmetic. */
function collapse(run: NumPart[]): string[] {
  const arithmetic = run.some((p) => p.kind === "tens" || p.kind === "teen" || p.kind === "hundred" || p.kind === "thousand");
  if (!arithmetic || run.some((p) => p.kind === "point")) {
    const s = run.map((p) => p.v).join("").replace(/^\.+|\.+$/g, "");
    return s ? [s] : [];
  }
  let total = 0, cur = 0;
  let last: NumPart["kind"] | null = null;
  for (const p of run) {
    switch (p.kind) {
      case "digit": cur = last === "tens" || last === "hundred" ? cur + Number(p.v) : cur * 10 + Number(p.v); break;
      case "teen":
      case "tens": cur = last === "hundred" || cur === 0 ? cur + Number(p.v) : cur * 100 + Number(p.v); break;
      case "hundred": cur = (cur || 1) * 100; break;
      case "thousand": total += (cur || 1) * 1000; cur = 0; break;
    }
    last = p.kind;
  }
  return [String(total + cur)];
}

export function normalize(text: string): string[] {
  let s = text.toLowerCase().replace(/[‘’]/g, "'");
  s = s.replace(/(\d),(?=\d{3}\b)/g, "$1");           // 2,500 -> 2500
  s = s.replace(/(?<=[a-z])-(?=[a-z])/g, " ");        // forty-five -> forty five
  for (const [re, to] of ALIASES) s = s.replace(re, to);
  // Punctuation ends a number run ("...three four five, one zero miles"). Keep decimal points inside numbers.
  s = s.replace(/(\d)\.(\d)/g, "$1\u0001$2").replace(/[^a-z0-9\u0001 ]+/g, " | ").replace(/\u0001/g, ".");
  const raw = s.split(/\s+/).filter(Boolean);

  // Homophones only between two digits: "one to zero" is 120, "climb to 3000" is not.
  const toks = raw.map((t, i) => {
    if (!(t in HOMOPHONES)) return t;
    const prev = raw[i - 1], next = raw[i + 1];
    const digitish = (x: string | undefined) => !!x && (x in DIGITS || isDigitTok(x));
    return digitish(prev) && digitish(next) ? HOMOPHONES[t] : t;
  });

  const out: string[] = [];
  let run: NumPart[] = [];
  const flush = () => { if (run.length) { out.push(...collapse(run)); run = []; } };
  for (const t of toks) {
    if (t === "|") { flush(); continue; }
    const p = numPart(t);
    // "hundred"/"thousand"/"point" only count inside a number.
    if (p && (p.kind === "digit" || p.kind === "teen" || p.kind === "tens" || run.length > 0)) { run.push(p); continue; }
    flush();
    out.push(isNumeric(t) ? t.replace(/^\.+|\.+$/g, "") : t);
  }
  flush();
  return out;
}

/** Digits only, for comparing "30.01" with "3001" or "121.85" with "12185". */
export const digitsOf = (t: string) => t.replace(/\D/g, "");

/**
 * Adjacent digits and phonetic letters squashed together, for callsigns:
 * "skyhawk seven three four sierra papa" -> ["734sp"].
 */
export function alnumRuns(tokens: string[]): string[] {
  const runs: string[] = [];
  let cur = "";
  for (const t of tokens) {
    const piece = /^\d+$/.test(t) ? t : PHONETIC[t] ?? (/^[a-z]$/.test(t) ? t : null);
    if (piece !== null) cur += piece;
    else if (cur) { runs.push(cur); cur = ""; }
  }
  if (cur) runs.push(cur);
  return runs;
}

export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** Words match exactly when short or numeric; longer words tolerate a speech-to-text slip. */
export function wordMatches(heard: string, want: string): boolean {
  if (heard === want) return true;
  if (isNumeric(want) || isNumeric(heard) || want.length <= 4) return false;
  return editDistance(heard, want) <= (want.length > 7 ? 2 : 1);
}

/** Index of the first place `phrase` occurs in `tokens`, or -1. */
export function findPhrase(tokens: string[], phrase: string[]): number {
  if (phrase.length === 0) return -1;
  for (let i = 0; i + phrase.length <= tokens.length; i++) {
    if (phrase.every((w, j) => wordMatches(tokens[i + j], w))) return i;
  }
  return -1;
}
