/** Private Pilot ACS areas of operation for the oral exam, with seed prompts for the examiner. */
export interface OralArea {
  id: string;
  label: string;
  acs: string;
  seeds: string[];
}

export const ORAL_AREAS: OralArea[] = [
  { id: "certificates", label: "Pilot qualifications & documents", acs: "I.A", seeds: ["certificates and documents required on board and on the pilot", "medical certificate duration", "currency for passengers day and night", "flight review", "BasicMed", "logbook endorsements", "private pilot privileges and limitations, pro-rata share"] },
  { id: "airworthiness", label: "Airworthiness requirements", acs: "I.B", seeds: ["required inspections", "required equipment for day and night VFR", "inoperative equipment and 91.213", "airworthiness directives", "who can perform maintenance", "special flight permits", "how to determine the airplane is airworthy from the logbooks"] },
  { id: "weather", label: "Weather information", acs: "I.C", seeds: ["METAR and TAF decoding", "sources of weather briefings", "fronts and stability", "fog types", "thunderstorm stages and avoidance", "icing", "wind shear", "density altitude", "AIRMET/SIGMET", "go/no-go decision on a marginal day in Charlotte"] },
  { id: "xc", label: "Cross-country flight planning", acs: "I.D", seeds: ["route selection and checkpoints", "true course to compass heading", "fuel planning and reserves", "weight and balance", "performance charts", "NOTAMs and TFRs", "flight plan filing", "diversion and lost procedures", "sectional chart symbols"] },
  { id: "airspace", label: "National airspace system", acs: "I.E", seeds: ["Charlotte Class B dimensions and entry requirements", "Mode C veil", "Class C, D, E, G requirements and weather minimums", "special use airspace", "TFRs and stadium rules", "speed limits", "ADS-B requirements", "the airspace around KJQF"] },
  { id: "performance", label: "Performance and limitations", acs: "I.F", seeds: ["takeoff and landing distance factors", "density altitude effects", "V-speeds and their meaning", "Va and weight", "weight and balance computation", "CG effects", "crosswind component", "the 172S limitations section"] },
  { id: "systems", label: "Operation of systems", acs: "I.G", seeds: ["172S engine and fuel injection", "fuel system and sumps", "electrical system and alternator failure", "vacuum system and instruments", "pitot-static system and blockages", "flaps", "brakes", "avionics and transponder", "what you'd do if each system failed"] },
  { id: "aeromedical", label: "Human factors", acs: "I.H", seeds: ["hypoxia types", "hyperventilation", "spatial disorientation illusions", "carbon monoxide", "IMSAFE, PAVE, DECIDE", "hazardous attitudes", "scuba and flying", "fatigue as a flight attendant who flies for fun", "alcohol and medication rules"] },
  { id: "preflight", label: "Preflight procedures", acs: "II", seeds: ["preflight inspection items and why", "fuel sump findings", "engine start and priming the 172S", "run-up and mag check limits", "taxi and runway incursion avoidance", "before-takeoff briefing"] },
  { id: "airport", label: "Airport and seaplane base operations", acs: "III", seeds: ["runway markings and signs", "lighting and PAPI", "traffic pattern entries at towered and non-towered fields", "light gun signals", "wake turbulence avoidance", "LAHSO", "radio phraseology", "ATIS vs AWOS"] },
  { id: "maneuvers", label: "Maneuvers", acs: "IV–VIII", seeds: ["steep turn aerodynamics and load factor", "slow flight", "power-off and power-on stalls", "spin causes and PARE", "ground reference maneuver wind correction", "short and soft field techniques", "go-around", "basic instrument maneuvers"] },
  { id: "emergency", label: "Emergency operations", acs: "IX", seeds: ["engine failure after takeoff", "engine failure in cruise and best glide", "engine fire", "electrical fire", "lost communications", "inadvertent IMC", "lost procedures", "emergency descent", "systems malfunctions", "ELT and transponder codes"] },
  { id: "night", label: "Night operations", acs: "XI", seeds: ["night vision and dark adaptation", "required lights and equipment", "night illusions", "night currency", "pilot-controlled lighting", "fuel reserves at night", "runway lighting colors"] },
];

export const oralAreaById = (id: string) => ORAL_AREAS.find((a) => a.id === id);
