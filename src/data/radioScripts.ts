/**
 * Scripted versions of the radio scenarios, used when Claude is unavailable.
 * Each turn is one call from the student. The app checks the call for the
 * required elements and shows the model call.
 *
 * Model calls use [elementId:text] to mark which words satisfy which element,
 * and {callsign} / {callsignShort} for the pilot's own callsign.
 *
 * PHRASEOLOGY HERE HAS NOT BEEN CHECKED BY A CFI. It follows AIM chapter 4,
 * sections 2 and 3, and the Pilot/Controller Glossary; local practice may differ.
 */
import type { RequiredElement } from "@/lib/radio/check";

export interface ScriptTurn {
  id: string;
  cue?: string;          // where you are / what just happened, when there is no ATC line
  speaker?: string;      // who says `atc`; defaults to the scenario's facility
  atc?: string;          // spoken before the student's call
  expect?: {
    elements: RequiredElement[];
    model: string;
    onMissAtc?: string;  // what the controller would say if a critical element is missing
  };
  /** Knowledge turn: answer in plain words, reveal, tick the points you covered. */
  selfGrade?: { modelAnswer: string; keyPoints: string[]; ref: string };
}

export interface RadioScript {
  scenarioId: string;
  atis?: string;      // phonetic word, e.g. "Delta"
  runway?: string;    // e.g. "20"
  turns: ScriptTurn[];
}

const facility: RequiredElement = { id: "facility", label: "Who you are calling", match: { slot: "facility" }, critical: true, hint: "Start with the facility name." };
const fullCallsign: RequiredElement = { id: "callsign", label: "Full callsign", match: { slot: "callsignFull" }, critical: true, hint: "Use the full callsign on initial contact." };
const callsign: RequiredElement = { id: "callsign", label: "Your callsign", match: { slot: "callsign" }, critical: true, hint: "Every readback ends with your callsign." };
const atis: RequiredElement = { id: "atis", label: "ATIS letter", match: { slot: "atis" }, critical: true, hint: "Say which ATIS information you have." };
const runway = (critical = true): RequiredElement => ({ id: "runway", label: "Runway number", match: { slot: "runway" }, critical, hint: "Say the runway number." });
const traffic: RequiredElement = { id: "traffic", label: "Traffic reply", match: { phrase: ["traffic in sight", "looking for traffic", "looking", "negative contact"] }, critical: true, hint: "Answer a traffic call with 'traffic in sight' or 'negative contact' (many pilots say 'looking')." };

const ctafStart: RequiredElement = { id: "start", label: "Starts with 'Monroe traffic'", match: { starts: ["monroe traffic"] }, critical: true, hint: "Every CTAF call starts with the airport name and 'traffic'." };
const ctafEnd: RequiredElement = { id: "end", label: "Ends with 'Monroe'", match: { ends: ["monroe"] }, critical: true, hint: "Repeat the airport name at the end." };

export const RADIO_SCRIPTS: RadioScript[] = [
  {
    scenarioId: "towered-taxi", atis: "Delta", runway: "20",
    turns: [
      {
        id: "initial", cue: "Engine running at the FBO ramp. Make your first call to Ground.",
        expect: {
          elements: [
            facility, fullCallsign,
            { id: "position", label: "Where you are", match: { phrase: ["fbo", "ramp"] }, hint: "Ground needs to know where you are on the airport." },
            atis,
            { id: "request", label: "Request taxi", match: { phrase: ["taxi"] }, critical: true },
            { id: "intentions", label: "Direction of flight", match: { phrase: ["south", "practice area", "vfr"] }, hint: "Say where you are going so they can plan your departure." },
          ],
          model: "[facility:Concord Ground], [callsign:{callsign}], [position:at the FBO ramp] [atis:with information Delta], [request:request taxi], [intentions:VFR to the south].",
          onMissAtc: "{callsign}, Concord Ground, verify you have information Delta and say your position.",
        },
      },
      {
        id: "taxi-readback", atc: "{callsign}, Concord Ground, runway two zero, taxi via Alpha, hold short of runway two zero.",
        expect: {
          elements: [
            runway(),
            { id: "route", label: "Taxi route", match: { phrase: ["via alpha", "alpha"] }, hint: "Read back the route so Ground can catch a mistake." },
            { id: "holdshort", label: "Hold short readback", match: { phrase: ["hold short", "holding short"] }, critical: true, hint: "Hold-short instructions must always be read back." },
            callsign,
          ],
          model: "[runway:Runway two zero], [route:taxi via Alpha], [holdshort:hold short of runway two zero], [callsign:{callsignShort}].",
          onMissAtc: "{callsignShort}, read back hold short instructions.",
        },
      },
      {
        id: "unclear", atc: "{callsignShort}, give way to the Citation crossing left to right, then continue via Alpha.",
        expect: {
          elements: [
            { id: "giveway", label: "Give way readback", match: { phrase: ["give way", "giving way"] }, critical: true },
            { id: "route", label: "Continue via Alpha", match: { phrase: ["alpha"] } },
            callsign,
          ],
          model: "[giveway:Give way to the Citation], [route:then Alpha], [callsign:{callsignShort}].",
        },
      },
    ],
  },
  {
    scenarioId: "towered-takeoff", atis: "Delta", runway: "20",
    turns: [
      {
        id: "ready", cue: "Run-up complete. You are holding short of runway 20 at Alpha and want closed traffic.",
        expect: {
          elements: [
            facility, fullCallsign,
            { id: "position", label: "Holding short, where", match: { phrase: ["holding short", "hold short"] } },
            runway(),
            { id: "ready", label: "Ready for departure", match: { phrase: ["ready for departure", "ready for takeoff", "ready"] }, critical: true },
            { id: "intentions", label: "Closed traffic", match: { phrase: ["closed traffic", "remain in the pattern", "pattern"] }, hint: "Tell the tower you want to stay in the pattern." },
          ],
          model: "[facility:Concord Tower], [callsign:{callsign}], [position:holding short of] [runway:runway two zero] at Alpha, [ready:ready for departure], [intentions:request closed traffic].",
        },
      },
      {
        id: "luaw", atc: "{callsignShort}, Concord Tower, runway two zero, line up and wait. Traffic crossing downfield.",
        expect: {
          elements: [
            runway(),
            { id: "luaw", label: "Line up and wait", match: { phrase: ["line up and wait"] }, critical: true, hint: "Read it back exactly. It is not a takeoff clearance." },
            callsign,
          ],
          model: "[runway:Runway two zero], [luaw:line up and wait], [callsign:{callsignShort}].",
          onMissAtc: "{callsignShort}, verify line up and wait, runway two zero.",
        },
      },
      {
        id: "takeoff", atc: "{callsignShort}, left closed traffic approved, wind two one zero at niner, runway two zero, cleared for takeoff.",
        expect: {
          elements: [
            { id: "closed", label: "Left closed traffic", match: { phrase: ["left closed traffic", "closed traffic"] } },
            runway(),
            { id: "cleared", label: "Cleared for takeoff", match: { phrase: ["cleared for takeoff"] }, critical: true },
            callsign,
          ],
          model: "[closed:Left closed traffic], [runway:runway two zero], [cleared:cleared for takeoff], [callsign:{callsignShort}].",
        },
      },
      {
        id: "midfield", cue: "Tower asked you to report midfield downwind. You are there now.",
        expect: {
          elements: [
            callsign,
            { id: "midfield", label: "Midfield", match: { phrase: ["midfield"] } },
            { id: "downwind", label: "Left downwind", match: { phrase: ["left downwind", "downwind"] }, critical: true },
            runway(false),
          ],
          model: "Concord Tower, [callsign:{callsignShort}], [midfield:midfield] [downwind:left downwind] [runway:runway two zero].",
        },
      },
      {
        id: "sequence", atc: "{callsignShort}, number two, follow the Cessna on base. Traffic at your eleven o'clock, two miles.",
        expect: {
          elements: [
            { id: "number", label: "Your sequence", match: { phrase: ["number two", "following", "follow"] }, hint: "Read back your place in the sequence." },
            traffic, callsign,
          ],
          model: "[number:Number two], [traffic:traffic in sight], [callsign:{callsignShort}].",
        },
      },
      {
        id: "landing", atc: "{callsignShort}, runway two zero, cleared to land.",
        expect: {
          elements: [
            runway(),
            { id: "cleared", label: "Cleared to land", match: { phrase: ["cleared to land"] }, critical: true },
            callsign,
          ],
          model: "[runway:Runway two zero], [cleared:cleared to land], [callsign:{callsignShort}].",
        },
      },
    ],
  },
  {
    scenarioId: "towered-inbound", atis: "Echo", runway: "20",
    turns: [
      {
        id: "inbound", cue: "Ten miles south of Concord at 2,500 feet with information Echo. You want a full-stop landing.",
        expect: {
          elements: [
            facility, fullCallsign,
            { id: "position", label: "Distance and direction", match: { all: [{ number: "10" }, { phrase: ["south"] }] }, critical: true, hint: "Position is distance and direction from the airport." },
            { id: "altitude", label: "Altitude", match: { number: "2500" }, hint: "Give your altitude." },
            atis,
            { id: "request", label: "Request", match: { phrase: ["full stop", "landing", "inbound", "land"] } },
          ],
          model: "[facility:Concord Tower], [callsign:{callsign}], [position:one zero miles south] at [altitude:two thousand five hundred], [atis:with information Echo], [request:inbound for a full-stop landing].",
        },
      },
      {
        id: "entry", atc: "{callsign}, Concord Tower, enter left downwind runway two zero, report midfield.",
        expect: {
          elements: [
            { id: "entry", label: "Left downwind", match: { phrase: ["left downwind"] }, critical: true },
            runway(),
            { id: "report", label: "Report midfield", match: { phrase: ["report midfield", "midfield"] }, hint: "Read back the reporting point so you remember to make the call." },
            callsign,
          ],
          model: "[entry:Enter left downwind] [runway:runway two zero], [report:report midfield], [callsign:{callsignShort}].",
        },
      },
      {
        id: "midfield", cue: "You are midfield on the left downwind.",
        expect: {
          elements: [
            callsign,
            { id: "midfield", label: "Midfield", match: { phrase: ["midfield"] }, critical: true },
            { id: "downwind", label: "Left downwind", match: { phrase: ["left downwind", "downwind"] } },
            runway(false),
          ],
          model: "Concord Tower, [callsign:{callsignShort}], [midfield:midfield] [downwind:left downwind] [runway:runway two zero].",
        },
      },
      {
        id: "sequence", atc: "{callsignShort}, number two, follow the Cirrus on a three mile final. Report traffic in sight.",
        expect: {
          elements: [
            { id: "number", label: "Your sequence", match: { phrase: ["number two", "following", "follow"] } },
            traffic, callsign,
          ],
          model: "[number:Number two], [traffic:looking for traffic], [callsign:{callsignShort}].",
        },
      },
      {
        id: "landing", atc: "{callsignShort}, runway two zero, cleared to land, wind one niner zero at one two.",
        expect: {
          elements: [
            runway(),
            { id: "cleared", label: "Cleared to land", match: { phrase: ["cleared to land"] }, critical: true },
            callsign,
          ],
          model: "[runway:Runway two zero], [cleared:cleared to land], [callsign:{callsignShort}].",
        },
      },
    ],
  },
  {
    scenarioId: "ctaf-pattern", runway: "23",
    turns: [
      {
        id: "ten-mile", cue: "Ten miles northwest of Monroe at 2,500 feet. Runway 23 is in use, left traffic. Announce yourself.",
        expect: {
          elements: [
            ctafStart, fullCallsign,
            { id: "position", label: "Distance and direction", match: { all: [{ number: "10" }, { phrase: ["northwest"] }] }, critical: true },
            { id: "altitude", label: "Altitude", match: { number: "2500" } },
            { id: "intentions", label: "Intentions", match: { phrase: ["inbound", "landing", "full stop", "land"] } },
            runway(false), ctafEnd,
          ],
          model: "[start:Monroe traffic], [callsign:{callsign}], [position:one zero miles northwest] at [altitude:two thousand five hundred], [intentions:inbound for landing] [runway:runway two three], [end:Monroe].",
        },
      },
      {
        id: "forty-five", speaker: "Other traffic", atc: "Monroe traffic, Cherokee four four Whiskey, departing runway two three, straight out to the southwest, Monroe.",
        cue: "Now you are entering the 45 for the left downwind.",
        expect: {
          elements: [
            ctafStart, callsign,
            { id: "leg", label: "On the 45", match: { phrase: ["45", "forty five"] }, critical: true },
            { id: "downwind", label: "Left downwind", match: { phrase: ["left downwind", "downwind"] } },
            runway(false), ctafEnd,
          ],
          model: "[start:Monroe traffic], [callsign:{callsignShort}], [leg:entering the forty-five] for [downwind:left downwind] [runway:runway two three], [end:Monroe].",
        },
      },
      {
        id: "downwind", cue: "You are established on the left downwind.",
        expect: {
          elements: [ctafStart, callsign, { id: "leg", label: "Left downwind", match: { phrase: ["left downwind"] }, critical: true, hint: "Say the pattern side: left downwind." }, runway(false), ctafEnd],
          model: "[start:Monroe traffic], [callsign:{callsignShort}], [leg:left downwind] [runway:runway two three], [end:Monroe].",
        },
      },
      {
        id: "base", cue: "You are turning base.",
        expect: {
          elements: [ctafStart, callsign, { id: "leg", label: "Left base", match: { phrase: ["left base", "base"] }, critical: true }, runway(false), ctafEnd],
          model: "[start:Monroe traffic], [callsign:{callsignShort}], [leg:left base] [runway:runway two three], [end:Monroe].",
        },
      },
      {
        id: "final", cue: "You are on final.",
        expect: {
          elements: [ctafStart, callsign, { id: "leg", label: "Final", match: { phrase: ["final"] }, critical: true }, runway(), ctafEnd],
          model: "[start:Monroe traffic], [callsign:{callsignShort}], [leg:final] [runway:runway two three], full stop, [end:Monroe].",
        },
      },
      {
        id: "clear", cue: "You have landed and are past the hold-short line on the taxiway.",
        expect: {
          elements: [ctafStart, callsign, { id: "leg", label: "Clear of the runway", match: { phrase: ["clear of runway", "clear of the runway", "clear runway", "clear of the active"] }, critical: true }, ctafEnd],
          model: "[start:Monroe traffic], [callsign:{callsignShort}], [leg:clear of runway two three], [end:Monroe].",
        },
      },
    ],
  },
  {
    scenarioId: "flight-following",
    turns: [
      {
        id: "initial", cue: "Climbing through 2,000 feet south of Concord. Tower handed you to Charlotte Approach. Make a short first call.",
        expect: {
          elements: [
            facility, fullCallsign,
            { id: "request", label: "VFR request", match: { phrase: ["vfr request", "request flight following", "flight following", "request"] }, critical: true, hint: "On a busy frequency, make a short call first and wait to be asked." },
          ],
          model: "[facility:Charlotte Approach], [callsign:{callsign}], [request:VFR request].",
        },
      },
      {
        id: "details", atc: "{callsign}, Charlotte Approach, say request.",
        expect: {
          elements: [
            callsign,
            { id: "type", label: "Aircraft type", match: { phrase: ["skyhawk", "cessna", "172"] } },
            { id: "position", label: "Position", match: { phrase: ["south of concord", "concord"] }, critical: true },
            { id: "altitude", label: "Altitude", match: { number: "2000" } },
            { id: "request", label: "Flight following", match: { phrase: ["flight following"] }, critical: true },
            { id: "destination", label: "Where you are going", match: { phrase: ["practice area", "monroe"] } },
          ],
          model: "[callsign:{callsign}] is a [type:Cessna 172], [position:two miles south of Concord], climbing through [altitude:two thousand], [request:request flight following] to the [destination:practice area near Monroe].",
        },
      },
      {
        id: "squawk", atc: "{callsign}, squawk four two seven one, Charlotte altimeter three zero zero one.",
        expect: {
          elements: [
            { id: "squawk", label: "Squawk code", match: { number: "4271" }, critical: true, hint: "Always read back the squawk." },
            { id: "altimeter", label: "Altimeter", match: { number: "3001" } },
            callsign,
          ],
          model: "Squawk [squawk:four two seven one], altimeter [altimeter:three zero zero one], [callsign:{callsignShort}].",
        },
      },
      {
        id: "bravo", atc: "{callsignShort}, radar contact two miles south of Concord. Remain clear of the Class Bravo airspace.",
        expect: {
          elements: [
            { id: "clear", label: "Remain clear of the Bravo", match: { phrase: ["remain clear", "clear of the bravo", "clear of bravo", "remain outside"] }, critical: true, hint: "Radar contact is not a Bravo clearance. Read back 'remain clear'." },
            callsign,
          ],
          model: "[clear:Remain clear of the Class Bravo], [callsign:{callsignShort}].",
        },
      },
      {
        id: "traffic", atc: "{callsignShort}, traffic two o'clock, three miles, northbound, a Piper at three thousand.",
        expect: { elements: [traffic, callsign], model: "[traffic:Looking for traffic], [callsign:{callsignShort}]." },
      },
      {
        id: "terminated", atc: "{callsignShort}, radar services terminated, squawk VFR, frequency change approved.",
        expect: {
          elements: [
            { id: "vfr", label: "Squawk VFR", match: { phrase: ["squawk vfr", "vfr", "1200"] }, critical: true, hint: "Squawk VFR means 1200." },
            callsign,
          ],
          model: "[vfr:Squawk VFR], [callsign:{callsignShort}].",
        },
      },
    ],
  },
  {
    scenarioId: "lost-comms", runway: "20",
    turns: [
      {
        id: "troubleshoot", atc: "Inbound to Concord, nobody answers your calls and you hear nothing. Before you decide the radio has failed, what do you check?",
        selfGrade: {
          modelAnswer: "Check the volume and squelch, confirm the frequency, check the audio panel selection, check the headset plugs, try the other radio or a handheld, and check the circuit breakers and alternator.",
          keyPoints: ["Volume and squelch", "Correct frequency", "Audio panel and headset jacks", "Other radio or handheld", "Circuit breakers and electrical power"],
          ref: "AIM 6-4-1, POH section 3",
        },
      },
      {
        id: "enter", atc: "The radio is dead. Concord is a towered airport. What do you squawk, and how do you get into the pattern?",
        selfGrade: {
          modelAnswer: "Squawk 7600. Stay outside or above the Class D surface area until you have worked out the direction and flow of traffic, then join the pattern and watch the tower for light signals.",
          keyPoints: ["Squawk 7600", "Stay outside or above the Class D until the traffic flow is known", "Join the pattern", "Watch the tower for light signals"],
          ref: "AIM 4-2-13",
        },
      },
      {
        id: "steady-green", atc: "You are on left downwind for runway two zero. The tower shows you a steady green light. What does it mean?",
        selfGrade: { modelAnswer: "In flight, steady green means cleared to land.", keyPoints: ["Cleared to land"], ref: "AIM 4-3-13, 14 CFR 91.125" },
      },
      {
        id: "steady-red", atc: "On downwind you see a steady red light. What does it mean?",
        selfGrade: { modelAnswer: "In flight, steady red means give way to other aircraft and continue circling.", keyPoints: ["Give way to other aircraft", "Continue circling"], ref: "AIM 4-3-13, 14 CFR 91.125" },
      },
      {
        id: "flashing-red", atc: "On final you see a flashing red light. What does it mean?",
        selfGrade: { modelAnswer: "In flight, flashing red means the airport is unsafe: do not land.", keyPoints: ["Airport unsafe", "Do not land"], ref: "AIM 4-3-13, 14 CFR 91.125" },
      },
      {
        id: "flashing-green", atc: "You went around. Now the tower shows a flashing green light. What does it mean in flight?",
        selfGrade: { modelAnswer: "In flight, flashing green means return for landing. It will be followed by a steady green at the proper time.", keyPoints: ["Return for landing", "Wait for the steady green before landing"], ref: "AIM 4-3-13, 14 CFR 91.125" },
      },
      {
        id: "ground", atc: "You have landed and stopped on the runway. The tower shows a flashing red light, then later a flashing green. What does each mean on the ground?",
        selfGrade: { modelAnswer: "On the ground, flashing red means taxi clear of the runway in use. Flashing green means cleared to taxi.", keyPoints: ["Flashing red: taxi clear of the runway in use", "Flashing green: cleared to taxi"], ref: "AIM 4-3-13, 14 CFR 91.125" },
      },
      {
        id: "other", atc: "Three more. On the ground: steady red, flashing white, and alternating red and green?",
        selfGrade: { modelAnswer: "Steady red: stop. Flashing white: return to your starting point on the airport. Alternating red and green: exercise extreme caution (same meaning in flight).", keyPoints: ["Steady red: stop", "Flashing white: return to starting point", "Alternating red and green: extreme caution"], ref: "AIM 4-3-13, 14 CFR 91.125" },
      },
      {
        id: "acknowledge", atc: "How do you tell the tower you saw the light signal, by day and by night?",
        selfGrade: { modelAnswer: "By day, rock the wings in flight, or move the ailerons or rudder on the ground. At night, flash the landing light or navigation lights.", keyPoints: ["Day, in flight: rock the wings", "Day, on the ground: move ailerons or rudder", "Night: flash the landing or navigation lights"], ref: "AIM 4-2-13" },
      },
    ],
  },
];

export const scriptFor = (scenarioId: string) => RADIO_SCRIPTS.find((s) => s.scenarioId === scenarioId);

export interface ModelSeg { text: string; el?: string }

/** Split "[facility:Concord Ground], {callsign}" into segments, filling in the callsign. */
export function renderModel(template: string, vars: Record<string, string>): ModelSeg[] {
  const filled = fill(template, vars);
  const segs: ModelSeg[] = [];
  const re = /\[([a-z0-9-]+):([^\]]+)\]/gi;
  let last = 0;
  for (let m = re.exec(filled); m; m = re.exec(filled)) {
    if (m.index > last) segs.push({ text: filled.slice(last, m.index) });
    segs.push({ text: m[2], el: m[1] });
    last = m.index + m[0].length;
  }
  if (last < filled.length) segs.push({ text: filled.slice(last) });
  return segs;
}

export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}

export const modelText = (segs: ModelSeg[]) => segs.map((s) => s.text).join("");
