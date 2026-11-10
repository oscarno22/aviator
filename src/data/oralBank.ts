import { ORAL_BANK_LOCAL } from "./oralBank.local";

/** Self-graded oral exam bank. Works with no AI. Answers must be checked by a CFI: `verified` stays false until then. */
export interface OralQuestion {
  id: string;            // stable, hand-written, kebab-case, prefixed by area id, e.g. "certificates-passenger-currency"
  areaId: string;        // must equal an OralArea.id from src/data/oralTopics.ts
  q: string;             // one question, as an examiner would ask it aloud
  answer: string;        // model answer, 1-4 sentences, short enough to say out loud
  keyPoints: string[];   // 2-5 short tickable points the answer must contain
  ref: string;           // e.g. "14 CFR 61.57(a)-(b)", "AIM 4-3-13", "PHAK Ch. 12", "C172S POH Section 2"
  followUp?: { q: string; answer: string };
  scenario?: boolean;    // true for "what would you do if" questions
  local?: boolean;       // true only in oralBank.local.ts
  verified?: boolean;    // leave unset
}

export const ORAL_BANK_GENERAL: OralQuestion[] = [
  // ───────── certificates ─────────
  {
    id: "certificates-documents-on-pilot",
    areaId: "certificates",
    q: "What documents do you need to have with you to act as pilot in command?",
    answer:
      "My pilot certificate, a government-issued photo ID, and a current medical certificate, or proof that I meet BasicMed. They have to be in my physical possession or readily accessible in the airplane.",
    keyPoints: ["Pilot certificate", "Government photo ID", "Current medical (or BasicMed)", "In possession or readily accessible in the aircraft"],
    ref: "14 CFR 61.3(a), (c)",
    followUp: {
      q: "And what documents must be in the airplane?",
      answer:
        "ARROW: Airworthiness certificate (displayed so it can be read), Registration, Radio station license (only for international flights), Operating limitations (the POH/AFM, placards and markings), and current Weight and balance data.",
    },
  },
  {
    id: "certificates-medical-duration",
    areaId: "certificates",
    q: "How long is a third-class medical certificate good for?",
    answer:
      "If I was under 40 on the date of the exam, it lasts 60 calendar months. If I was 40 or older, it lasts 24 calendar months. Either way it expires at the end of the last day of that month.",
    keyPoints: ["Under 40 at exam: 60 calendar months", "40 or older at exam: 24 calendar months", "Expires at the end of the month"],
    ref: "14 CFR 61.23(d)",
    followUp: {
      q: "You hold a first-class medical and you are under 40. How long can you use it for private pilot privileges?",
      answer: "60 calendar months. After the higher-class privileges lapse, it is still good for third-class privileges for the full third-class duration.",
    },
  },
  {
    id: "certificates-passenger-currency",
    areaId: "certificates",
    q: "What do you need to have done recently in order to carry passengers, by day and at night?",
    answer:
      "Three takeoffs and three landings in the preceding 90 days as sole manipulator of the controls, in the same category and class, and type if a type rating is required. To carry passengers at night, those three have to be to a full stop and done between one hour after sunset and one hour before sunrise.",
    keyPoints: [
      "3 takeoffs and 3 landings in the preceding 90 days",
      "Sole manipulator, same category and class (and type if required)",
      "Night: full-stop landings",
      "Night period: 1 hour after sunset to 1 hour before sunrise",
    ],
    ref: "14 CFR 61.57(a)-(b)",
    followUp: {
      q: "Do touch-and-goes count for day currency in a 172?",
      answer: "Yes. Full-stop landings are only required for night currency and for tailwheel airplanes.",
    },
  },
  {
    id: "certificates-flight-review",
    areaId: "certificates",
    q: "What is a flight review, and how often do you need one?",
    answer:
      "To act as pilot in command I need a flight review within the preceding 24 calendar months. It is at least 1 hour of flight training and 1 hour of ground training with an authorized instructor, covering Part 91 rules and the maneuvers the instructor chooses, and it ends with a logbook endorsement.",
    keyPoints: ["Within the preceding 24 calendar months", "Minimum 1 hour flight and 1 hour ground", "Given by an authorized instructor", "Logbook endorsement"],
    ref: "14 CFR 61.56",
    followUp: {
      q: "What can take the place of a flight review?",
      answer: "Passing a practical test or proficiency check for a certificate, rating or operating privilege, or completing a phase of the FAA WINGS program, within the same 24 calendar months.",
    },
  },
  {
    id: "certificates-pro-rata-share",
    areaId: "certificates",
    q: "As a private pilot, can your passengers pay for the flight?",
    answer:
      "I cannot fly for compensation or hire, but I can share the operating expenses. I must pay at least my pro rata share, and only fuel, oil, airport expenditures and rental fees can be shared.",
    keyPoints: ["No compensation or hire", "Must pay at least the pro rata share", "Only fuel, oil, airport expenditures, rental fees"],
    ref: "14 CFR 61.113(a), (c)",
    followUp: {
      q: "Can you fly yourself to a business meeting for your job?",
      answer: "Yes, if the flight is only incidental to the business or employment and I am not carrying passengers or property for compensation or hire.",
    },
  },

  // ───────── airworthiness ─────────
  {
    id: "airworthiness-required-inspections",
    areaId: "airworthiness",
    q: "What inspections must be current for this airplane to be legal for a VFR flight?",
    answer:
      "An annual inspection within the preceding 12 calendar months, a 100-hour inspection if the airplane is used to carry people for hire or for flight instruction for hire that the instructor provides, the transponder check every 24 calendar months, and the ELT inspection every 12 calendar months. All applicable airworthiness directives must also be complied with. The altimeter and pitot-static check every 24 calendar months is only required for IFR.",
    keyPoints: ["Annual: 12 calendar months", "100-hour if operated for hire or rental instruction", "Transponder: 24 calendar months", "ELT: 12 calendar months", "ADs complied with"],
    ref: "14 CFR 91.409(a)-(b), 91.413, 91.207(d), 91.411",
    followUp: {
      q: "Can the 100-hour limit ever be exceeded?",
      answer: "Yes, by up to 10 hours, but only while flying to a place where the inspection can be done. The extra time is counted toward the next 100 hours.",
    },
  },
  {
    id: "airworthiness-day-vfr-equipment",
    areaId: "airworthiness",
    q: "What instruments and equipment are required for day VFR flight?",
    answer:
      "The 91.205(b) list: airspeed indicator, altimeter, magnetic compass, tachometer, oil pressure gauge, oil temperature gauge, a fuel gauge for each tank, an ELT, seat belts, shoulder harnesses for the front seats, and anticollision lights on newer airplanes like this one. Manifold pressure, coolant temperature and gear position indicators are on the list too but do not apply to a 172S. On top of that, anything the POH equipment list marks as required.",
    keyPoints: ["Airspeed indicator, altimeter, magnetic compass", "Tachometer, oil pressure, oil temperature", "Fuel gauge for each tank", "ELT, seat belts and shoulder harnesses", "Anticollision lights"],
    ref: "14 CFR 91.205(b)",
  },
  {
    id: "airworthiness-inoperative-equipment",
    areaId: "airworthiness",
    q: "During preflight you find a piece of equipment that does not work, and the airplane has no minimum equipment list. How do you decide whether you can fly?",
    answer:
      "I use 91.213(d). The item must not be required by the VFR-day type certification, by the POH equipment list or kinds of operations list, by 91.205 or another rule for the flight I am making, or by an airworthiness directive. If it passes all four, it must be removed, or deactivated and placarded \"Inoperative\", and a pilot or mechanic must decide it is not a hazard. Otherwise the airplane is not airworthy until it is fixed.",
    keyPoints: [
      "Not required by VFR-day type certification",
      "Not required by the POH equipment list / kinds of operations list",
      "Not required by 91.205 or other rules for the flight",
      "Not required by an AD",
      "Remove or deactivate, placard Inoperative, no hazard",
    ],
    ref: "14 CFR 91.213(d)",
    scenario: true,
  },
  {
    id: "airworthiness-airworthiness-directives",
    areaId: "airworthiness",
    q: "What is an airworthiness directive, and is compliance optional?",
    answer:
      "An AD is a legally enforceable rule the FAA issues to correct an unsafe condition in an aircraft, engine, propeller or appliance. Compliance is mandatory. ADs can be one-time or recurring, and compliance is recorded in the maintenance records.",
    keyPoints: ["Corrects an unsafe condition", "Mandatory", "One-time or recurring", "Recorded in the maintenance records"],
    ref: "14 CFR Part 39; 14 CFR 91.403, 91.417",
    followUp: {
      q: "Who is responsible for making sure the airplane is kept airworthy, and who decides it is safe for this flight?",
      answer: "The owner or operator is primarily responsible for maintaining it in an airworthy condition, including AD compliance. The pilot in command is responsible for determining that it is in condition for safe flight before each flight.",
    },
  },
  {
    id: "airworthiness-special-flight-permit",
    areaId: "airworthiness",
    q: "You are away from home and discover the annual inspection expired last month. Can the airplane be flown home legally?",
    answer:
      "Not as it is. The owner or operator can apply for a special flight permit, often called a ferry permit, which is issued through the local Flight Standards District Office. It allows an aircraft that does not currently meet airworthiness requirements, but is capable of safe flight, to be flown to a place where the inspection or repairs can be done.",
    keyPoints: ["Not legal without the annual", "Special flight permit (ferry permit)", "Issued through the FSDO", "Aircraft must be capable of safe flight"],
    ref: "14 CFR 21.197, 21.199; 14 CFR 91.409(a)",
    scenario: true,
  },

  // ───────── weather ─────────
  {
    id: "weather-thunderstorm-stages",
    areaId: "weather",
    q: "What does a thunderstorm need in order to form, and what are its stages?",
    answer:
      "It needs moisture, unstable air and a lifting action. The cumulus stage is mostly updrafts. The mature stage starts when precipitation begins to fall and has both updrafts and downdrafts; it is the most intense. The dissipating stage is mostly downdrafts.",
    keyPoints: ["Moisture, unstable air, lifting action", "Cumulus stage: updrafts", "Mature stage: precipitation begins, most intense", "Dissipating stage: downdrafts"],
    ref: "PHAK Ch. 12; AC 00-24",
    followUp: {
      q: "How far away should you stay from a severe thunderstorm?",
      answer: "At least 20 miles. Hail and severe turbulence can extend well outside the cloud, and I should never fly under the anvil or try to go beneath the storm.",
    },
  },
  {
    id: "weather-fog-types",
    areaId: "weather",
    q: "Describe radiation fog and advection fog and how they differ.",
    answer:
      "Radiation fog forms on clear, calm nights when the ground cools the air next to it to its dew point. It is usually shallow and burns off after sunrise. Advection fog forms when moist air moves over a cooler surface; it needs wind, is common near coasts, and can last through the day.",
    keyPoints: ["Radiation: clear sky, calm wind, ground cools at night", "Radiation fog usually burns off after sunrise", "Advection: moist air moving over a cooler surface", "Advection needs wind and can persist"],
    ref: "PHAK Ch. 12",
    followUp: {
      q: "What in a METAR warns you that fog is likely?",
      answer: "A small and shrinking temperature and dew point spread, especially with light wind in the evening or early morning.",
    },
  },
  {
    id: "weather-airmet-sigmet",
    areaId: "weather",
    q: "What is the difference between an AIRMET, a SIGMET and a convective SIGMET?",
    answer:
      "An AIRMET, issued today as a graphical G-AIRMET, covers weather that is mainly a concern for light aircraft: Sierra for IFR conditions and mountain obscuration, Tango for moderate turbulence, strong surface winds and low-level wind shear, and Zulu for moderate icing and freezing levels. A SIGMET covers non-convective weather hazardous to all aircraft, such as severe icing, severe or extreme turbulence, and dust, sand or volcanic ash. A convective SIGMET covers thunderstorm hazards such as severe or embedded thunderstorms, lines of storms and tornadoes.",
    keyPoints: [
      "AIRMET: mainly light aircraft; Sierra, Tango, Zulu",
      "Sierra IFR/mountain obscuration, Tango turbulence/winds, Zulu icing",
      "SIGMET: hazardous to all aircraft, non-convective",
      "Convective SIGMET: thunderstorm hazards",
    ],
    ref: "AIM Chapter 7, Section 1 (Inflight Aviation Weather Advisories)",
  },
  {
    id: "weather-stable-vs-unstable-air",
    areaId: "weather",
    q: "What kind of weather would you expect in stable air compared with unstable air?",
    answer:
      "Stable air gives stratiform clouds, smooth air, steady precipitation and fair to poor visibility in haze. Unstable air gives cumuliform clouds, turbulence, showery precipitation and good visibility outside the showers.",
    keyPoints: ["Stable: stratiform clouds, smooth air", "Stable: steady precipitation, poorer visibility", "Unstable: cumuliform clouds, turbulence", "Unstable: showers, good visibility"],
    ref: "PHAK Ch. 12",
  },
  {
    id: "weather-briefing-sources",
    areaId: "weather",
    q: "Where do you get a weather briefing, and what kinds of briefing can you ask for?",
    answer:
      "From Flight Service, by phone at 1-800-WX-BRIEF or online, with aviationweather.gov as a supplement. A standard briefing is the full picture when I have no weather yet. An abbreviated briefing updates one I already have. An outlook briefing is for a departure six or more hours away.",
    keyPoints: ["Flight Service: 1-800-WX-BRIEF or online", "Standard briefing", "Abbreviated briefing", "Outlook briefing: departure 6 or more hours away"],
    ref: "AIM Chapter 7, Section 1 (Preflight Briefing); 14 CFR 91.103",
  },

  // ───────── xc ─────────
  {
    id: "xc-fuel-reserves",
    areaId: "xc",
    q: "What are the VFR fuel requirements?",
    answer:
      "Considering wind and forecast weather, I need enough fuel to fly to the first point of intended landing and then, at normal cruise speed, for at least 30 more minutes by day or 45 more minutes at night.",
    keyPoints: ["To the first point of intended landing", "Day: 30 minutes more", "Night: 45 minutes more", "At normal cruising speed"],
    ref: "14 CFR 91.151(a)",
    followUp: {
      q: "How much usable fuel does the 172S carry?",
      answer: "53 gallons usable with full tanks. I plan fuel burn from the POH Section 5 cruise tables, not from a rule of thumb.",
    },
  },
  {
    id: "xc-true-course-to-compass-heading",
    areaId: "xc",
    q: "Walk me from the true course you measure on the sectional to the compass heading you fly.",
    answer:
      "True course corrected for wind gives true heading. True heading corrected for magnetic variation gives magnetic heading: subtract easterly variation, add westerly. Magnetic heading corrected for deviation from the compass card gives compass heading.",
    keyPoints: ["True course + wind correction = true heading", "True heading + variation = magnetic heading", "East is least (subtract), west is best (add)", "Magnetic heading + deviation = compass heading"],
    ref: "PHAK Ch. 16",
  },
  {
    id: "xc-preflight-action",
    areaId: "xc",
    q: "What does the regulation on preflight action require you to know before a cross-country flight?",
    answer:
      "All available information about the flight. For a flight away from the vicinity of an airport that means weather reports and forecasts, fuel requirements, alternatives if the flight cannot be completed as planned, and any known traffic delays. For every flight it means runway lengths at the airports I intend to use and the takeoff and landing distance data for the airplane.",
    keyPoints: ["Weather reports and forecasts", "Fuel requirements", "Alternatives", "Known traffic delays", "Runway lengths and takeoff/landing distances"],
    ref: "14 CFR 91.103",
  },
  {
    id: "xc-lost-procedures",
    areaId: "xc",
    q: "You are on a cross-country, the next checkpoint does not show up, and you are not sure where you are. What do you do?",
    answer:
      "Fly the airplane and hold my heading while I check the time and my last known position. Then the five Cs: climb for a better view and radio range, communicate with ATC or Flight Service or on 121.5, confess that I am unsure of my position, comply with the help I am given, and conserve fuel by leaning and reducing power.",
    keyPoints: ["Keep flying the airplane; note time and last known position", "Climb", "Communicate and confess", "Comply", "Conserve fuel"],
    ref: "PHAK Ch. 16; AIM Chapter 6 (Emergency Procedures)",
    scenario: true,
  },
  {
    id: "xc-vfr-cruising-altitudes",
    areaId: "xc",
    q: "How do you choose a VFR cruising altitude?",
    answer:
      "In level cruise more than 3,000 feet above the ground, on a magnetic course of 0 through 179 degrees I fly odd thousands plus 500 feet, such as 3,500 or 5,500. On a magnetic course of 180 through 359 degrees I fly even thousands plus 500, such as 4,500 or 6,500. It is based on magnetic course, not heading.",
    keyPoints: ["Applies above 3,000 ft AGL", "0-179 degrees: odd thousands + 500", "180-359 degrees: even thousands + 500", "Magnetic course, not heading"],
    ref: "14 CFR 91.159",
  },

  // ───────── airspace ─────────
  {
    id: "airspace-class-b-requirements",
    areaId: "airspace",
    q: "What do you need in order to fly into Class B airspace?",
    answer:
      "An explicit ATC clearance into the Class B, a two-way radio, a transponder with altitude reporting, and ADS-B Out. The pilot needs at least a private pilot certificate, or a student pilot needs the specific Class B endorsements. VFR weather minimums are 3 statute miles visibility and clear of clouds.",
    keyPoints: ["ATC clearance", "Two-way radio", "Mode C transponder and ADS-B Out", "Private certificate, or student with endorsement", "3 SM and clear of clouds"],
    ref: "14 CFR 91.131, 91.215, 91.225, 91.155, 61.95",
  },
  {
    id: "airspace-class-c-d-entry",
    areaId: "airspace",
    q: "What do you need before entering Class C or Class D airspace?",
    answer:
      "For both I must establish two-way radio communication before entering, which means the controller has answered using my call sign. Class C also requires a transponder with altitude reporting and ADS-B Out. Class D has no transponder requirement of its own.",
    keyPoints: ["Two-way radio communication established before entry", "Controller must use my call sign", "Class C: Mode C transponder and ADS-B Out", "No clearance needed, unlike Class B"],
    ref: "14 CFR 91.129(c), 91.130(c)-(d), 91.215, 91.225",
    followUp: {
      q: "The controller says \"aircraft calling, standby.\" Can you enter?",
      answer: "No. My call sign was not used, so communication is not established. If the controller says my call sign and \"standby\", it is established and I may enter unless told to remain outside.",
    },
  },
  {
    id: "airspace-vfr-weather-minimums",
    areaId: "airspace",
    q: "What are the basic VFR weather minimums in Class C, D and E airspace below 10,000 feet MSL?",
    answer:
      "3 statute miles visibility, and stay 500 feet below, 1,000 feet above and 2,000 feet horizontally from clouds. At and above 10,000 feet MSL in Class E it becomes 5 statute miles, 1,000 feet below, 1,000 feet above and 1 statute mile horizontally.",
    keyPoints: ["3 SM visibility", "500 below, 1,000 above, 2,000 horizontal", "At and above 10,000 MSL: 5 SM", "1,000 below, 1,000 above, 1 SM horizontal"],
    ref: "14 CFR 91.155(a)",
    followUp: {
      q: "What about Class G at 1,200 feet AGL or less?",
      answer: "By day, 1 statute mile and clear of clouds. At night, 3 statute miles and 500 below, 1,000 above, 2,000 horizontal.",
    },
  },
  {
    id: "airspace-speed-limits",
    areaId: "airspace",
    q: "What are the aircraft speed limits you need to know?",
    answer:
      "250 knots indicated below 10,000 feet MSL. 200 knots at or below 2,500 feet AGL within 4 nautical miles of the primary airport of Class C or Class D airspace. 200 knots in the airspace underlying Class B or in a VFR corridor through it.",
    keyPoints: ["250 KIAS below 10,000 MSL", "200 KIAS at or below 2,500 AGL within 4 NM of a Class C or D airport", "200 KIAS beneath Class B or in a VFR corridor"],
    ref: "14 CFR 91.117",
  },
  {
    id: "airspace-special-use",
    areaId: "airspace",
    q: "Name the types of special use airspace on a sectional and what each means for you as a VFR pilot.",
    answer:
      "Prohibited areas: no flight. Restricted areas: I need permission from the controlling agency when they are active. Warning areas: the same kind of hazards, but offshore. Military operations areas: VFR flight is allowed but I should use extreme caution and check whether they are active. Alert areas: a high volume of training or unusual activity, no permission needed, stay alert.",
    keyPoints: ["Prohibited: no entry", "Restricted: permission needed when active", "Warning: offshore hazards", "MOA: VFR allowed, use caution, check status", "Alert: high training volume, be vigilant"],
    ref: "AIM Chapter 3, Section 4",
  },

  // ───────── performance ─────────
  {
    id: "performance-va-and-weight",
    areaId: "performance",
    q: "What is maneuvering speed, and why does it change with weight?",
    answer:
      "Va is the speed at or below which the airplane will stall before it exceeds its limit load factor in a single full control input or strong gust. It gets lower as weight goes down, because a lighter airplane flies at a lower angle of attack and can build more load factor before it reaches the stalling angle. In the 172S it is 105 knots at 2,550 pounds, 98 at 2,200 and 90 at 1,900.",
    keyPoints: ["Airplane stalls before exceeding limit load", "Decreases as weight decreases", "105 KIAS at 2,550 lb", "98 KIAS at 2,200 lb, 90 KIAS at 1,900 lb"],
    ref: "PHAK Ch. 5; C172S POH Section 2",
    followUp: {
      q: "Is Va marked on the airspeed indicator?",
      answer: "No. It is on a placard and in the POH limitations section, because it changes with weight.",
    },
  },
  {
    id: "performance-density-altitude-effects",
    areaId: "performance",
    q: "What is density altitude, and how does a high density altitude affect the airplane?",
    answer:
      "Density altitude is pressure altitude corrected for nonstandard temperature. It goes up with high elevation, high temperature, low pressure and high humidity. In thin air the engine makes less power, the propeller makes less thrust and the wing needs more true airspeed, so the takeoff and landing rolls are longer and the climb rate is lower. Indicated speeds stay the same.",
    keyPoints: ["Pressure altitude corrected for nonstandard temperature", "High, hot, humid raises it", "Less power, thrust and lift", "Longer takeoff roll and weaker climb", "Fly the same indicated airspeeds"],
    ref: "PHAK Ch. 4, Ch. 11; C172S POH Section 5",
  },
  {
    id: "performance-cg-effects",
    areaId: "performance",
    q: "How does the airplane behave with a forward center of gravity compared with an aft one?",
    answer:
      "A forward CG makes the airplane more stable, but the tail has to push down harder, so stall speed is higher, cruise is slower and it takes more back pressure to flare. An aft CG gives a lower stall speed and slightly faster cruise, but the airplane is less stable and stall and spin recovery get harder. Outside the aft limit, recovery may be impossible.",
    keyPoints: ["Forward: more stable", "Forward: higher stall speed, slower cruise, heavier flare", "Aft: less stable", "Aft: stall and spin recovery harder"],
    ref: "PHAK Ch. 10; C172S POH Section 6",
  },
  {
    id: "performance-airspeed-indicator-markings",
    areaId: "performance",
    q: "Explain the colored arcs on the 172S airspeed indicator.",
    answer:
      "The white arc is the flap operating range, from Vs0 at 40 up to Vfe at 85. The green arc is the normal operating range, from Vs1 at 48 up to Vno at 129. The yellow arc from 129 to 163 is the caution range, for smooth air only. The red line at 163 is Vne, never exceed.",
    keyPoints: ["White: 40 to 85, flap operating range (Vs0 to Vfe)", "Green: 48 to 129, normal operating range (Vs1 to Vno)", "Yellow: 129 to 163, smooth air only", "Red line: 163, Vne"],
    ref: "C172S POH Section 2",
    followUp: {
      q: "What is the flap speed limit for the first 10 degrees?",
      answer: "110 KIAS for 10 degrees of flaps. Beyond 10 degrees the limit is 85 KIAS, the top of the white arc.",
    },
  },
  {
    id: "performance-crosswind-component",
    areaId: "performance",
    q: "You plan to land on runway 36 and the wind is 030 at 20 knots. What is the crosswind component, and is it within the airplane's capability?",
    answer:
      "The wind is 30 degrees off the runway, and at 30 degrees the crosswind is about half the wind speed, so about 10 knots. The maximum demonstrated crosswind for the 172S is 15 knots. That number is not a limitation, but it is what a test pilot demonstrated, so I also compare it to my own personal limit.",
    keyPoints: ["Wind angle is 30 degrees", "Crosswind about 10 knots", "Maximum demonstrated crosswind 15 knots", "Demonstrated value is not a limitation; apply personal minimums"],
    ref: "C172S POH Section 4 and Section 5 (crosswind chart); PHAK Ch. 11",
    scenario: true,
    followUp: {
      q: "What are the rules of thumb for other wind angles?",
      answer: "About half the wind speed at 30 degrees, about 70 percent at 45 degrees, about 90 percent at 60 degrees, and all of it at 90 degrees.",
    },
  },

  // ───────── systems ─────────
  {
    id: "systems-engine-description",
    areaId: "systems",
    q: "Describe the engine in the 172S.",
    answer:
      "A Lycoming IO-360-L2A: four cylinders, horizontally opposed, air cooled, direct drive, normally aspirated and fuel injected, rated at 180 horsepower at 2,700 rpm.",
    keyPoints: ["Lycoming IO-360-L2A", "Four cylinder, horizontally opposed, air cooled", "Direct drive, normally aspirated", "Fuel injected", "180 hp at 2,700 rpm"],
    ref: "C172S POH Section 1 and Section 7",
    followUp: {
      q: "Where is the carburetor heat control?",
      answer: "There is none. The engine is fuel injected, so there is no carburetor to ice up. If the induction air filter gets blocked, an alternate air door opens automatically.",
    },
  },
  {
    id: "systems-fuel-system",
    areaId: "systems",
    q: "Trace the fuel from the tanks to the cylinders in the 172S.",
    answer:
      "Fuel flows by gravity from the two wing tanks through the selector valve, which has Left, Right and Both positions, into a reservoir tank. From there it goes through the electric auxiliary fuel pump, the fuel shutoff valve and the strainer to the engine-driven fuel pump, then the fuel/air control unit, the flow divider and the injector nozzles. Usable fuel is 53 gallons and there are 13 sump drains.",
    keyPoints: ["Two wing tanks, gravity fed", "Selector valve: Left, Right, Both", "Electric auxiliary pump and engine-driven pump", "53 gallons usable", "13 sump drains"],
    ref: "C172S POH Section 7",
    followUp: {
      q: "Where are the 13 sumps?",
      answer: "Five under each wing tank and three under the fuselage, for the fuel selector, the reservoir and the strainer.",
    },
  },
  {
    id: "systems-alternator-failure",
    areaId: "systems",
    q: "In cruise the low-voltage light comes on and the ammeter shows a discharge. What has happened and what do you do?",
    answer:
      "The alternator has stopped charging, so the battery is carrying the whole 28-volt system and will run down. I follow the POH checklist, shed every electrical load I do not need, and land as soon as practical. The engine keeps running because the magnetos are independent of the electrical system.",
    keyPoints: ["Alternator is not charging; battery is draining", "Follow the POH Section 3 checklist", "Reduce electrical load", "Land as soon as practical", "Engine keeps running on the magnetos"],
    ref: "C172S POH Section 3 and Section 7",
    scenario: true,
    followUp: {
      q: "What would you lose when the battery is exhausted?",
      answer: "Everything electrical: radios, transponder, lights, electric flaps, the turn coordinator and the electric fuel gauges and pump. I should plan a no-flap landing and expect light gun signals at a towered airport.",
    },
  },
  {
    id: "systems-pitot-static-blockage",
    areaId: "systems",
    q: "Which instruments use the pitot-static system, and what happens if the static port becomes blocked?",
    answer:
      "The airspeed indicator uses both pitot and static pressure; the altimeter and vertical speed indicator use static pressure only. With the static port blocked, the altimeter freezes at the altitude where it blocked, the VSI reads zero, and the airspeed indicator reads too low above that altitude and too high below it. The fix is the alternate static source.",
    keyPoints: ["Airspeed indicator, altimeter, VSI", "Altimeter freezes", "VSI reads zero", "Airspeed is wrong: low above, high below the blockage altitude", "Use the alternate static source"],
    ref: "PHAK Ch. 8; C172S POH Section 7",
    followUp: {
      q: "What if the pitot tube and its drain hole both block?",
      answer: "The airspeed indicator behaves like an altimeter: it reads higher as I climb and lower as I descend, regardless of actual speed.",
    },
  },
  {
    id: "systems-vacuum-system",
    areaId: "systems",
    q: "In a 172S with conventional round instruments, which instruments are driven by the vacuum system, and what happens if it fails?",
    answer:
      "The attitude indicator and the heading indicator are vacuum driven. If vacuum is lost, their gyros spin down and they slowly become unreliable. The turn coordinator is electric, so I use it with the magnetic compass, altimeter and airspeed indicator, and stay in visual conditions.",
    keyPoints: ["Attitude indicator and heading indicator", "They become unreliable gradually", "Turn coordinator is electric and keeps working", "Use the magnetic compass for heading"],
    ref: "C172S POH Section 7; PHAK Ch. 8",
    followUp: {
      q: "How would you notice a vacuum failure?",
      answer: "The suction gauge reads below the green arc and, where fitted, a low vacuum annunciator comes on. The instruments themselves may look normal at first, which is why I check the gauge.",
    },
  },

  // ───────── aeromedical ─────────
  {
    id: "aeromedical-hypoxia-types",
    areaId: "aeromedical",
    q: "What is hypoxia, and what are the four types?",
    answer:
      "Hypoxia is a lack of enough oxygen in the body. Hypoxic hypoxia is from too little oxygen available, as at altitude. Hypemic hypoxia is when the blood cannot carry oxygen, as with carbon monoxide. Stagnant hypoxia is poor circulation, as from pulling Gs. Histotoxic hypoxia is when the cells cannot use the oxygen, as with alcohol or drugs.",
    keyPoints: ["Hypoxic: altitude", "Hypemic: blood cannot carry oxygen (carbon monoxide)", "Stagnant: poor circulation", "Histotoxic: cells cannot use oxygen (alcohol, drugs)"],
    ref: "PHAK Ch. 17; AIM 8-1-2",
    followUp: {
      q: "When must the pilot use supplemental oxygen?",
      answer: "For any time over 30 minutes above 12,500 feet up to and including 14,000 feet cabin pressure altitude, and the whole time above 14,000. Above 15,000 feet every occupant must be provided with oxygen. That is 14 CFR 91.211.",
    },
  },
  {
    id: "aeromedical-hyperventilation",
    areaId: "aeromedical",
    q: "What is hyperventilation, and how do you treat it?",
    answer:
      "It is breathing too fast or too deeply, usually from stress or fear, which removes too much carbon dioxide from the blood. The symptoms are lightheadedness, dizziness, tingling in the hands and feet, and visual disturbance, much like hypoxia. I treat it by slowing my breathing, talking out loud, or breathing into a paper bag.",
    keyPoints: ["Too much carbon dioxide breathed off", "Usually caused by stress or anxiety", "Symptoms resemble hypoxia: lightheaded, tingling", "Slow the breathing rate, talk aloud, or breathe into a bag"],
    ref: "PHAK Ch. 17; AIM 8-1-3",
  },
  {
    id: "aeromedical-carbon-monoxide",
    areaId: "aeromedical",
    q: "On a cold day with the cabin heat on, you develop a headache and feel drowsy, and you think you smell exhaust. What is going on and what do you do?",
    answer:
      "I suspect carbon monoxide poisoning. Cabin heat comes from air passed over the exhaust muffler, so a crack can let exhaust into the cabin. I turn the heat off, open the fresh air vents and windows, land as soon as I can, and get medical attention, because carbon monoxide takes a long time to leave the blood.",
    keyPoints: ["Suspect carbon monoxide", "Cabin heat off", "Fresh air vents and windows open", "Land as soon as possible and seek medical attention"],
    ref: "AIM 8-1-4; PHAK Ch. 17",
    scenario: true,
  },
  {
    id: "aeromedical-alcohol-rules",
    areaId: "aeromedical",
    q: "What are the rules on alcohol and flying?",
    answer:
      "I may not act as a crewmember within 8 hours after drinking any alcohol, while under the influence of alcohol, with a blood alcohol concentration of 0.04 percent or greater, or while using any drug that affects my faculties in a way contrary to safety. Eight hours is the legal minimum; feeling the effects of a hangover still means I am not fit to fly.",
    keyPoints: ["8 hours bottle to throttle", "Not while under the influence", "Blood alcohol 0.04 percent or greater", "No drugs that affect faculties contrary to safety"],
    ref: "14 CFR 91.17",
    followUp: {
      q: "A passenger shows up obviously drunk. Can you take them?",
      answer: "No. Except in an emergency, a pilot may not carry a person who appears to be intoxicated or under the influence of drugs, other than a medical patient under proper care.",
    },
  },
  {
    id: "aeromedical-scuba-diving",
    areaId: "aeromedical",
    q: "How long should you wait to fly after scuba diving?",
    answer:
      "For a flight up to 8,000 feet cabin altitude, at least 12 hours after a dive that did not need a controlled ascent, and at least 24 hours after a dive that needed decompression stops. For any flight above 8,000 feet, at least 24 hours after any dive. The risk is decompression sickness from nitrogen coming out of solution.",
    keyPoints: ["Up to 8,000 ft: 12 hours after a no-decompression dive", "Up to 8,000 ft: 24 hours after a decompression-stop dive", "Above 8,000 ft: 24 hours after any dive", "Risk is decompression sickness"],
    ref: "AIM 8-1-2",
  },

  // ───────── preflight ─────────
  {
    id: "preflight-fuel-sump-findings",
    areaId: "preflight",
    q: "You sump the fuel and see a clear bubble at the bottom of the sample cup. What is it and what do you do?",
    answer:
      "It is water, which is heavier than fuel and settles at the bottom. I keep draining that sump until the samples come out clean, then recheck all the sumps, since more water can migrate to the low points. If I cannot get clean samples, I do not fly and I have a mechanic look at it.",
    keyPoints: ["Clear layer at the bottom is water", "Keep draining until samples are clean", "Recheck the other sumps", "No-go and call a mechanic if contamination persists"],
    ref: "C172S POH Section 4; PHAK Ch. 7",
    scenario: true,
    followUp: {
      q: "What else are you looking for in the sample?",
      answer: "The right color and smell for the fuel grade, blue for 100LL, and no sediment or other contamination.",
    },
  },
  {
    id: "preflight-magneto-check",
    areaId: "preflight",
    q: "What are you looking for during the magneto check at run-up?",
    answer:
      "At 1,800 rpm I select each magneto in turn. The drop on either one should be no more than 150 rpm, the difference between the two no more than 50 rpm, and the engine should stay smooth. Then I make sure the switch is back on Both.",
    keyPoints: ["Run-up at 1,800 rpm", "Maximum drop 150 rpm on either magneto", "Maximum difference 50 rpm", "Engine stays smooth; switch back to Both"],
    ref: "C172S POH Section 4",
    followUp: {
      q: "What if there is no rpm drop at all on one magneto?",
      answer: "That is not good news. It suggests that magneto is not being grounded, for example a broken P-lead, so it may be live with the switch off. I would not fly and would report it to maintenance.",
    },
  },
  {
    id: "preflight-engine-start-priming",
    areaId: "preflight",
    q: "How do you prime the 172S for a normal start, given that it is fuel injected?",
    answer:
      "There is no manual primer. With the throttle open about a quarter inch and the mixture at idle cutoff, I turn on the auxiliary fuel pump, advance the mixture to rich until I see fuel flow, then return it to idle cutoff and turn the pump off. I crank, and as the engine fires I advance the mixture smoothly to rich. The exact steps are in POH Section 4.",
    keyPoints: ["Prime with the auxiliary fuel pump and the mixture", "Mixture rich until fuel flow shows, then back to idle cutoff", "Pump off before cranking", "Advance mixture to rich as the engine fires"],
    ref: "C172S POH Section 4 (Starting Engine)",
    followUp: {
      q: "What do you check right after the engine starts?",
      answer: "Oil pressure. If it has not come up into the green within the time the POH allows, I shut the engine down.",
    },
  },
  {
    id: "preflight-runway-incursion-avoidance",
    areaId: "preflight",
    q: "How do you avoid a runway incursion while taxiing at a towered airport?",
    answer:
      "I have the airport diagram out, write down the taxi clearance, and read back every hold short instruction with the runway and my call sign. I need a specific clearance to cross or enter any runway. I keep my eyes outside, save checklists for when I am stopped, and if I am unsure I stop and ask, or request progressive taxi.",
    keyPoints: ["Airport diagram out; write down the clearance", "Read back all hold short instructions", "Specific clearance needed to cross or enter each runway", "Heads up while moving", "If unsure, stop and ask or request progressive taxi"],
    ref: "AIM 4-3-18; 14 CFR 91.129(i)",
  },
  {
    id: "preflight-takeoff-briefing",
    areaId: "preflight",
    q: "What do you brief before takeoff?",
    answer:
      "The runway and wind, the type of takeoff and the speeds, the point where I will abort if the airplane is not performing, and the engine failure plan. If the engine fails on the roll, I close the throttle and stop. Just after liftoff, I lower the nose and land straight ahead or slightly to either side. I only consider turning back above an altitude I have decided on beforehand.",
    keyPoints: ["Runway, wind, type of takeoff, speeds", "Abort point", "Engine failure on the roll: throttle idle, brake", "Engine failure after liftoff: nose down, land roughly straight ahead", "Pre-decided altitude before any turn back"],
    ref: "AFH (Takeoffs and Departure Climbs); C172S POH Section 3",
  },

  // ───────── airport ─────────
  {
    id: "airport-light-gun-signals",
    areaId: "airport",
    q: "Your radio has failed and the tower is using a light gun. What do the signals mean when you are in flight?",
    answer:
      "Steady green: cleared to land. Flashing green: return for landing. Steady red: give way to other aircraft and continue circling. Flashing red: airport unsafe, do not land. Alternating red and green: exercise extreme caution.",
    keyPoints: ["Steady green: cleared to land", "Flashing green: return for landing", "Steady red: give way and continue circling", "Flashing red: airport unsafe, do not land", "Alternating red and green: extreme caution"],
    ref: "14 CFR 91.125; AIM 4-3-13",
    followUp: {
      q: "And on the ground?",
      answer: "Steady green: cleared for takeoff. Flashing green: cleared to taxi. Steady red: stop. Flashing red: taxi clear of the runway in use. Flashing white: return to starting point on the airport. Alternating red and green: exercise extreme caution.",
    },
  },
  {
    id: "airport-wake-turbulence",
    areaId: "airport",
    q: "You are cleared to land behind a large jet that is landing on the same runway. How do you avoid its wake turbulence?",
    answer:
      "Wingtip vortices sink below the flight path and stop being produced when the jet touches down. So I stay at or above its approach path, note where it touched down, and land beyond that point. I can also ask for more spacing or go around.",
    keyPoints: ["Vortices sink below the flight path", "Stay at or above the jet's flight path", "Land beyond its touchdown point", "Ask for more spacing or go around if in doubt"],
    ref: "AIM Chapter 7 (Wake Turbulence)",
    scenario: true,
    followUp: {
      q: "What if you are taking off behind a departing large jet?",
      answer: "Note its rotation point, lift off before that point, and climb above its flight path or turn upwind of it. The worst vortices come from an aircraft that is heavy, clean and slow.",
    },
  },
  {
    id: "airport-papi",
    areaId: "airport",
    q: "How do you read a PAPI?",
    answer:
      "A PAPI is a row of four lights beside the runway. Two white and two red means I am on the glide path. More white than red means I am high, all white is too high. More red than white means I am low, and four red is well below the glide path.",
    keyPoints: ["Row of four lights", "Two white, two red: on glide path", "More white: high", "More red: low"],
    ref: "AIM 2-1-2",
  },
  {
    id: "airport-hold-short-markings",
    areaId: "airport",
    q: "Describe the runway holding position marking and which side you stop on.",
    answer:
      "It is four yellow lines across the taxiway, two solid and two dashed. The solid lines are on the side where I hold. At a towered airport I do not cross from the solid side without a clearance. When I exit the runway I cross from the dashed side without stopping, and I am not clear of the runway until the whole airplane is past the marking.",
    keyPoints: ["Four yellow lines: two solid, two dashed", "Hold on the solid side", "Need clearance to cross at a towered airport", "Clear of the runway only when the whole airplane is past the lines"],
    ref: "AIM 2-3-5",
    followUp: {
      q: "What sign goes with it?",
      answer: "A runway holding position sign: white runway numbers on a red background. Red signs are mandatory instruction signs.",
    },
  },
  {
    id: "airport-nontowered-pattern-entry",
    areaId: "airport",
    q: "How do you enter the traffic pattern at a non-towered airport?",
    answer:
      "I listen to the weather and the CTAF to work out the runway in use, and self-announce from about 10 miles out. The recommended entry is a 45-degree entry to the downwind leg at midfield, at pattern altitude. All turns are to the left unless the airport indicates right traffic.",
    keyPoints: ["Monitor and self-announce on CTAF from about 10 miles", "45-degree entry to midfield downwind", "At pattern altitude", "Left turns unless right traffic is indicated"],
    ref: "14 CFR 91.126(b); AIM 4-3-3; AC 90-66",
    followUp: {
      q: "At a towered airport, the tower clears you to land and hold short of an intersecting runway. Do you have to accept?",
      answer: "No. A pilot can always decline a land and hold short clearance, and student pilots should not accept one. If I accept it, I must read it back and comply.",
    },
  },

  // ───────── maneuvers ─────────
  {
    id: "maneuvers-steep-turn-load-factor",
    areaId: "maneuvers",
    q: "What happens to load factor and stall speed in a level steep turn?",
    answer:
      "Load factor increases with bank angle. In a level 45-degree bank it is about 1.4 Gs, and at 60 degrees it is 2 Gs. Stall speed goes up with the square root of the load factor, so about 19 percent higher at 45 degrees and about 41 percent higher at 60 degrees. That is why I need more back pressure and usually a little more power to hold altitude.",
    keyPoints: ["Load factor rises with bank angle", "About 1.4 G at 45 degrees, 2 G at 60 degrees", "Stall speed rises with the square root of load factor", "More back pressure and power needed to hold altitude"],
    ref: "PHAK Ch. 5; AFH (Performance Maneuvers)",
    followUp: {
      q: "What causes the overbanking tendency?",
      answer: "In a steep turn the outside wing travels faster than the inside wing and makes more lift, so the airplane wants to keep rolling into the turn. I hold a little opposite aileron to stop it.",
    },
  },
  {
    id: "maneuvers-stall-cause-and-recovery",
    areaId: "maneuvers",
    q: "What causes a stall, and how do you recover?",
    answer:
      "A stall happens when the wing exceeds its critical angle of attack. That can happen at any airspeed, any attitude and any power setting. To recover I reduce the angle of attack first by lowering the nose, level the wings with coordinated controls, add full power, and then retract flaps in stages as I return to a climb.",
    keyPoints: ["Exceeding the critical angle of attack", "Any airspeed, attitude or power setting", "First: reduce angle of attack", "Level wings, coordinated", "Full power, then clean up and climb"],
    ref: "AFH (Maintaining Aircraft Control: Upset Prevention and Recovery Training); PHAK Ch. 5",
  },
  {
    id: "maneuvers-spin-pare",
    areaId: "maneuvers",
    q: "What causes a spin, and how do you recover from one?",
    answer:
      "A spin needs a stall plus yaw, usually from being uncoordinated when the airplane stalls. Recovery is PARE: Power to idle, Ailerons neutral, Rudder full opposite to the rotation, and Elevator briskly forward to break the stall. When the rotation stops I neutralize the rudder and ease out of the dive. The POH procedure is the final word.",
    keyPoints: ["Stall plus yaw (uncoordinated)", "Power idle", "Ailerons neutral", "Rudder full opposite the rotation", "Elevator forward, then recover from the dive"],
    ref: "AFH (Maintaining Aircraft Control); C172S POH Section 3",
    followUp: {
      q: "Where in the traffic pattern is an inadvertent spin most likely?",
      answer: "In a skidding turn from base to final: low, slow, and using too much inside rudder to tighten the turn. There is not enough altitude to recover, so prevention is what counts.",
    },
  },
  {
    id: "maneuvers-short-vs-soft-field-takeoff",
    areaId: "maneuvers",
    q: "What is the difference in technique between a short-field takeoff and a soft-field takeoff in the 172S?",
    answer:
      "Both use 10 degrees of flaps. For a short field I use all the runway, hold the brakes, apply full power, and climb at 56 KIAS until the obstacle is cleared. For a soft field I keep the airplane rolling with the yoke held back to take weight off the nosewheel, lift off as early as possible, then level off in ground effect to accelerate before climbing.",
    keyPoints: ["Flaps 10 degrees for both", "Short: full power against the brakes, use all the runway", "Short: 56 KIAS until obstacles are cleared", "Soft: keep rolling, yoke back, weight off the nosewheel", "Soft: lift off early, accelerate in ground effect"],
    ref: "C172S POH Section 4; AFH (Takeoffs and Departure Climbs)",
  },
  {
    id: "maneuvers-go-around",
    areaId: "maneuvers",
    q: "On short final another airplane taxis onto your runway. Talk me through what you do.",
    answer:
      "Go around. Full power, pitch to a climb attitude, and reduce the flaps to 20 degrees right away. Once I have a positive rate of climb and a safe speed and altitude, I retract the rest of the flaps in stages. I sidestep so I can keep the runway and the other airplane in sight, then tell the tower or announce on CTAF.",
    keyPoints: ["Full power first", "Pitch for a climb", "Flaps to 20 degrees immediately, the rest in stages", "Sidestep to keep traffic in sight", "Aviate first, then communicate"],
    ref: "C172S POH Section 4 (Balked Landing); AFH (Approaches and Landings)",
    scenario: true,
  },

  // ───────── emergency ─────────
  {
    id: "emergency-engine-failure-after-takeoff",
    areaId: "emergency",
    q: "The engine quits at 400 feet right after takeoff. What do you do?",
    answer:
      "Lower the nose immediately and hold 70 KIAS with flaps up, or 65 with flaps down. I land more or less straight ahead, turning only enough to avoid obstacles, and I do not try to turn back to the runway. If there is time I secure the engine: mixture to idle cutoff, fuel shutoff valve off, ignition off, flaps as needed, and master off.",
    keyPoints: ["Nose down immediately", "70 KIAS flaps up, 65 KIAS flaps down", "Land straight ahead with only small turns", "No turn back to the runway", "Secure fuel, ignition and master if time permits"],
    ref: "C172S POH Section 3",
    scenario: true,
  },
  {
    id: "emergency-engine-failure-in-cruise",
    areaId: "emergency",
    q: "The engine fails in cruise at 4,500 feet. What do you do?",
    answer:
      "Pitch for best glide, 68 KIAS, and trim. Pick the best landing site within gliding distance and turn toward it. Then run the restart flow from the POH: fuel shutoff valve in, selector on Both, auxiliary pump on, mixture rich, magnetos checked. If it will not restart, I squawk 7700, declare an emergency, brief my passengers, and set up for a forced landing.",
    keyPoints: ["Best glide 68 KIAS and trim", "Pick a landing site and head for it", "Restart checklist: fuel, pump, mixture, ignition", "Squawk 7700 and declare an emergency", "Prepare for the forced landing"],
    ref: "C172S POH Section 3",
    scenario: true,
  },
  {
    id: "emergency-engine-fire-in-flight",
    areaId: "emergency",
    q: "You see smoke and flames coming from the engine cowling in flight. What do you do?",
    answer:
      "Cut off the fuel: mixture to idle cutoff, fuel shutoff valve off, auxiliary fuel pump off. Master switch off, and cabin heat and air off to keep smoke out. I pitch for 100 KIAS, faster if the fire is not out, to try to find a speed that gives an incombustible mixture, and then make a forced landing. I do not try to restart the engine.",
    keyPoints: ["Mixture idle cutoff, fuel shutoff valve off, pump off", "Master switch off", "Cabin heat and air off", "100 KIAS, faster if the fire persists", "Forced landing; no restart"],
    ref: "C172S POH Section 3",
    scenario: true,
  },
  {
    id: "emergency-lost-communications",
    areaId: "emergency",
    q: "You are inbound to a towered airport in Class D and your radio stops working. What do you do?",
    answer:
      "First I troubleshoot: volume, frequency, headset plugs, audio panel, the other radio. If it is really dead I squawk 7600, stay outside or above the Class D until I have worked out the direction and flow of traffic, then join the pattern and watch the tower for light gun signals. I acknowledge them by rocking the wings in daylight, or flashing the landing light at night.",
    keyPoints: ["Troubleshoot first", "Squawk 7600", "Determine the traffic flow before entering the pattern", "Watch the tower for light gun signals", "Acknowledge: rock wings by day, flash lights at night"],
    ref: "AIM 4-2-13, AIM 6-4-2; 14 CFR 91.125, 91.129(d)",
    scenario: true,
  },
  {
    id: "emergency-transponder-codes",
    areaId: "emergency",
    q: "What are the emergency transponder codes and the emergency frequency?",
    answer:
      "7500 is unlawful interference, or hijack. 7600 is lost communications. 7700 is a general emergency. The emergency frequency is 121.5. If I am already talking to ATC, I stay on that frequency and keep my assigned code unless told otherwise.",
    keyPoints: ["7500: hijack", "7600: lost communications", "7700: emergency", "121.5 MHz"],
    ref: "AIM 6-2-2, AIM 6-3-1, AIM 4-1-20",
    followUp: {
      q: "When must the ELT battery be replaced or recharged?",
      answer: "After more than 1 cumulative hour of use, or when 50 percent of its useful life has expired. The ELT itself must be inspected every 12 calendar months. That is 14 CFR 91.207.",
    },
  },

  // ───────── night ─────────
  {
    id: "night-three-definitions",
    areaId: "night",
    q: "There are three different time periods in the regulations that pilots loosely call night. What are they and what is each one for?",
    answer:
      "From sunset to sunrise, position lights must be on. Night as defined in Part 1, the end of evening civil twilight to the beginning of morning civil twilight, is when I can log night time. From one hour after sunset to one hour before sunrise is the period for night passenger currency.",
    keyPoints: ["Sunset to sunrise: position lights", "Civil twilight to civil twilight: logging night time", "1 hour after sunset to 1 hour before sunrise: passenger currency"],
    ref: "14 CFR 1.1, 91.209, 61.57(b)",
    followUp: {
      q: "What about the anticollision lights?",
      answer: "If the airplane has an anticollision light system, it must be on whenever the airplane is operated, day or night, unless the pilot in command decides it should be off in the interest of safety.",
    },
  },
  {
    id: "night-required-equipment",
    areaId: "night",
    q: "What extra equipment is required for VFR flight at night?",
    answer:
      "Everything required for day VFR, plus position lights, an anticollision light system, an adequate source of electrical energy, a landing light if the airplane is operated for hire, and spare fuses if the airplane uses fuses: one spare set or three of each kind, where the pilot can reach them.",
    keyPoints: ["All day VFR equipment", "Position lights and anticollision lights", "Source of electrical energy", "Landing light if for hire", "Spare fuses, if fuses are used"],
    ref: "14 CFR 91.205(c)",
  },
  {
    id: "night-vision-dark-adaptation",
    areaId: "night",
    q: "How do your eyes work differently at night, and how do you make the best of them?",
    answer:
      "Night vision relies on the rods, which sit around the edge of the retina, not in the center. That leaves a night blind spot in the middle of my vision, so I look slightly off-center and keep scanning. Full dark adaptation takes about 30 minutes and is lost in seconds by bright light, so I avoid bright white light and keep cockpit lighting low.",
    keyPoints: ["Rods handle night vision", "Central night blind spot: use off-center viewing", "About 30 minutes to dark adapt", "Bright light destroys adaptation; keep cockpit lights dim"],
    ref: "PHAK Ch. 17; AIM 8-1-6",
  },
  {
    id: "night-black-hole-approach",
    areaId: "night",
    q: "You are on a straight-in approach at night to a lit runway with dark, featureless terrain in front of it. What illusion should you expect and how do you guard against it?",
    answer:
      "The black-hole illusion. With no visual references around the runway, I will feel higher than I am and tend to fly a low, dragged-in approach. I guard against it by using the PAPI or VASI, cross-checking the altimeter and vertical speed, and flying a normal pattern instead of a long straight-in when I can.",
    keyPoints: ["Black-hole illusion", "Feel too high, so fly too low", "Use PAPI or VASI", "Cross-check altimeter and VSI; fly a normal pattern"],
    ref: "PHAK Ch. 17; AIM 8-1-5",
    scenario: true,
    followUp: {
      q: "What is autokinesis?",
      answer: "Staring at a single point of light against a dark background for several seconds makes it appear to move. The fix is to keep my eyes moving and not fixate.",
    },
  },
  {
    id: "night-airport-lighting-colors",
    areaId: "night",
    q: "What colors are the runway and taxiway lights you will see at night?",
    answer:
      "Runway edge lights are white. Threshold lights are green from the approach side, and runway end lights are red. Taxiway edge lights are blue and taxiway centerline lights are green. A civilian land airport beacon flashes white and green.",
    keyPoints: ["Runway edge: white", "Threshold: green; runway end: red", "Taxiway edge: blue", "Taxiway centerline: green", "Beacon: white and green"],
    ref: "AIM 2-1-4, 2-1-10; AIM Chapter 2, Section 1 (Airport Beacons)",
    followUp: {
      q: "How does pilot-controlled lighting work?",
      answer: "I key the microphone on the published frequency: 7 clicks within 5 seconds for high intensity, 5 for medium, 3 for low. The lights stay on for 15 minutes from the last activation.",
    },
  },
];

export const ORAL_BANK: OralQuestion[] = [...ORAL_BANK_GENERAL, ...ORAL_BANK_LOCAL];

export const oralByArea = (areaId: string) => ORAL_BANK.filter((q) => q.areaId === areaId);
