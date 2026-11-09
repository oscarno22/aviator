export interface RadioScenario {
  id: string;
  title: string;
  airportId: string;
  facility: string;      // who he's talking to
  frequency: number;
  summary: string;       // one line for the picker
  situation: string;     // full briefing shown before the first call
  atis?: string;
  objectives: string[];  // what the coach grades
  opensWith: "pilot" | "atc";
  kickoff?: string;      // ATC's first line when opensWith === "atc"
  ctaf?: boolean;        // nobody answers; the model plays other traffic
}

export const RADIO_SCENARIOS: RadioScenario[] = [
  {
    id: "towered-taxi",
    title: "Taxi clearance at Concord",
    airportId: "KJQF",
    facility: "Concord Ground",
    frequency: 121.85,
    summary: "Engine running at the FBO, ATIS in hand. Ask Ground for taxi.",
    situation: "You are at the FBO ramp at Concord-Padgett with the engine running, run-up not yet done. You have listened to ATIS information Delta. You want to fly to the practice area to the south, VFR. Call Ground for taxi. Expect a runway assignment, a taxi route, and possibly a hold-short instruction. Read back runway assignments and hold-short instructions with your callsign.",
    atis: "Concord airport information Delta, one four five two Zulu. Wind two one zero at niner. Visibility one zero. Sky clear. Temperature two five, dew point one four. Altimeter three zero zero one. Landing and departing runway two zero. Advise on initial contact you have information Delta.",
    objectives: ["Initial call: who you're calling, who you are, where you are, ATIS letter, what you want", "Read back the runway assignment and any hold-short instruction with callsign", "Ask if any part of the taxi instruction is unclear instead of guessing"],
    opensWith: "pilot",
  },
  {
    id: "towered-takeoff",
    title: "Takeoff clearance and pattern work",
    airportId: "KJQF",
    facility: "Concord Tower",
    frequency: 134.65,
    summary: "Holding short of runway 20 after the run-up. Get your takeoff clearance.",
    situation: "Run-up complete, you are holding short of runway 20 at taxiway Alpha at Concord. You want to stay in the pattern for three landings. Call the tower ready for departure. Expect 'line up and wait' or a takeoff clearance with 'left closed traffic approved', and later a sequence and a landing clearance. Read back every runway assignment, line-up-and-wait, takeoff and landing clearance with your callsign.",
    atis: "Concord airport information Delta, wind two one zero at niner, altimeter three zero zero one, landing and departing runway two zero.",
    objectives: ["'Ready for departure' call with position and intentions (closed traffic)", "Correct readback of line up and wait / cleared for takeoff including the runway", "Report positions when asked (midfield downwind, base) and read back the landing clearance", "Respond to traffic calls with 'looking' or 'traffic in sight'"],
    opensWith: "pilot",
  },
  {
    id: "towered-inbound",
    title: "Inbound to Concord with ATIS",
    airportId: "KJQF",
    facility: "Concord Tower",
    frequency: 134.65,
    summary: "Ten miles south at 2,500 ft, coming home. Call the tower.",
    situation: "You are 10 miles south of Concord at 2,500 ft MSL returning from the practice area with information Echo. You want a full-stop landing. Call the tower with position, altitude, ATIS, and request. Expect a pattern entry instruction such as 'enter left downwind runway two zero, report midfield', sequencing behind other traffic, and a landing clearance. There is a Cirrus on a five-mile final.",
    atis: "Concord airport information Echo, wind one niner zero at one two, visibility one zero, few clouds at five thousand, altimeter two niner niner eight, landing and departing runway two zero.",
    objectives: ["Inbound call: position with distance and direction, altitude, ATIS letter, request", "Read back the pattern entry and reporting point", "Position report at the requested point", "Read back the landing clearance with the runway number", "Acknowledge traffic and sequencing instructions"],
    opensWith: "pilot",
  },
  {
    id: "ctaf-pattern",
    title: "Non-towered pattern at Monroe (CTAF)",
    airportId: "KEQY",
    facility: "Monroe traffic",
    frequency: 122.7,
    summary: "Self-announce every leg into Monroe. Nobody answers; other pilots are listening.",
    situation: "You are 10 miles northwest of Charlotte-Monroe Executive at 2,500 ft. AWOS says wind 230 at 8, altimeter 30.02, so runway 23 is in use, left traffic. Make your calls on CTAF 122.7: 10 miles out with intentions, entering the 45 to the downwind, downwind, base, final, and clear of the runway. Each call: 'Monroe traffic', who you are, where you are, what you're doing, 'Monroe'. Other aircraft will make their own calls; listen for conflicts.",
    objectives: ["Every call starts and ends with 'Monroe traffic' / 'Monroe'", "Position, altitude and intentions in the 10-mile call", "A call on each leg: 45, downwind, base, final, clear", "Correct runway and pattern side", "Respond sensibly to another aircraft's call that could conflict"],
    opensWith: "pilot",
    ctaf: true,
  },
  {
    id: "flight-following",
    title: "VFR flight following with Charlotte Approach",
    airportId: "KJQF",
    facility: "Charlotte Approach",
    frequency: 128.325,
    summary: "Climbing out of Concord to the south. Pick up flight following and stay out of the Bravo.",
    situation: "You just departed Concord runway 20, climbing through 2,000 ft heading south toward the practice area near Monroe. Tower told you to contact Charlotte Approach on 128.325. Request VFR flight following. Expect: 'say type and position', a squawk code, the altimeter, 'radar contact', traffic advisories, and a reminder to remain clear of the Class Bravo unless you ask for and receive a clearance. Read back the squawk and any altitude or heading instruction. If you ask for a Bravo clearance, you must hear the words 'cleared into the Class Bravo airspace'.",
    objectives: ["Initial call: facility, callsign, type, position, altitude, request", "Read back the squawk and altimeter", "Respond to traffic with 'looking for traffic' or 'traffic in sight'", "Do not enter the Bravo without the explicit clearance words", "Acknowledge 'radar services terminated, squawk VFR' correctly"],
    opensWith: "pilot",
  },
  {
    id: "lost-comms",
    title: "Lost comms and light gun signals",
    airportId: "KJQF",
    facility: "Concord Tower (light signals)",
    frequency: 134.65,
    summary: "Your radio dies inbound. The tower talks to you with light signals. What do they mean?",
    situation: "Inbound to Concord your radio goes silent: no sidetone, nobody answers. You squawk 7600, enter the pattern for runway 20 and watch the tower. The tower will describe the light signal it is giving you; you say what it means and what you will do. This is a knowledge drill: answer in plain words, then the coach corrects you.",
    objectives: ["Troubleshooting steps before declaring lost comms (volume, frequency, headset jacks, other radio)", "Squawk 7600 and the correct pattern entry", "Meaning of each light gun signal in flight and on the ground", "How to acknowledge signals (rock wings by day, flash landing light at night)"],
    opensWith: "atc",
    kickoff: "Tower here. Your radio is dead and you have squawked seven six hundred. You are on left downwind for runway two zero. I am pointing the light gun at you and you see a steady green light. What does it mean, and what do you do?",
  },
];

export const scenarioById = (id: string) => RADIO_SCENARIOS.find((s) => s.id === id);
