/**
 * Instructor-style concept cards for spaced repetition and pop quizzes.
 * Keep answers short enough to say out loud. "why" is the follow-up an
 * instructor asks when the first answer is thin.
 */
export type ConceptArea =
  | "airspace" | "weather" | "regs" | "systems" | "aero" | "performance"
  | "airport" | "emergency" | "aeromedical" | "navigation" | "custom";

export interface ConceptCard {
  id: string;
  area: ConceptArea;
  q: string;
  a: string;
  why?: string;
  tags?: string[];
}

export const CONCEPT_AREAS: { id: ConceptArea; label: string; acs: string }[] = [
  { id: "airspace", label: "Airspace", acs: "I.E" },
  { id: "weather", label: "Weather", acs: "I.C" },
  { id: "regs", label: "Regulations & documents", acs: "I.A, I.B" },
  { id: "systems", label: "Aircraft systems", acs: "I.G" },
  { id: "aero", label: "Aerodynamics", acs: "I.G, VII" },
  { id: "performance", label: "Performance & W&B", acs: "I.F" },
  { id: "airport", label: "Airport operations", acs: "III" },
  { id: "emergency", label: "Emergencies", acs: "IX" },
  { id: "aeromedical", label: "Aeromedical & ADM", acs: "I.H" },
  { id: "navigation", label: "Navigation & comms", acs: "I.D, VI" },
];

const cards: ConceptCard[] = [];
const counters: Partial<Record<ConceptArea, number>> = {};
function c(area: ConceptArea, q: string, a: string, why?: string, tags?: string[]) {
  const n = (counters[area] = (counters[area] ?? 0) + 1);
  cards.push({ id: `${area}-${n}`, area, q, a, why, tags });
}

// ---------------- Airspace ----------------
c("airspace", "What are the VFR weather minimums in Class E below 10,000 ft MSL?", "3 statute miles visibility; 500 below, 1,000 above, 2,000 feet horizontal from clouds.", "Because IFR traffic can pop out of a cloud at you; the 500/1000/2000 gives both of you time to see and avoid.");
c("airspace", "VFR minimums in Class G, daytime, below 1,200 ft AGL?", "1 statute mile and clear of clouds.", "Nobody is under ATC control down there, so the rule is just: stay out of the clouds and see where you're going.");
c("airspace", "VFR minimums in Class B?", "3 statute miles and clear of clouds.", "Everyone in Bravo is being separated by ATC, so the cloud clearance can be less; you still need the visibility to see traffic.");
c("airspace", "VFR minimums in Class C and D?", "3 statute miles; 500 below, 1,000 above, 2,000 horizontal.");
c("airspace", "VFR minimums in Class E at or above 10,000 ft MSL?", "5 statute miles; 1,000 below, 1,000 above, 1 statute mile horizontal.", "Faster airplanes up there; more room to react.");
c("airspace", "What do you need to enter Class B?", "A specific clearance: ATC must say 'cleared into the Class Bravo airspace'. Two-way radio, Mode C transponder and ADS-B Out, and a private pilot certificate (or student endorsement).", "Squawk and radar contact are not a clearance. If you didn't hear the word 'cleared', you stay out.");
c("airspace", "How high does the Charlotte Class B go, and where can you find the shelf floors?", "Up to 10,000 ft MSL. The floors of each shelf are printed on the Charlotte Terminal Area Chart (TAC) and sectional.", "Flying out of KJQF you are under a shelf; know the floor over the practice area so you don't climb into Bravo without a clearance.");
c("airspace", "What is the Mode C veil?", "The area within 30 nm of a Class B primary airport (like CLT), from the surface to 10,000 ft, where a Mode C transponder and ADS-B Out are required.", "So ATC can see altitude on everything near the busiest airports, even VFR traffic under the shelves.");
c("airspace", "What do you need to enter Class C?", "Two-way radio communication established with ATC before entry, Mode C transponder and ADS-B Out.", "'Established' means they used your callsign. 'Aircraft calling, stand by' counts; 'stand by' without your callsign does not.");
c("airspace", "What do you need to enter Class D?", "Two-way radio communication established with the tower before entry.");
c("airspace", "Typical dimensions of Class D?", "Surface up to about 2,500 ft AGL, roughly a 4 nm radius, tailored to the airport. Ceiling shown in a bracket on the chart in hundreds of feet MSL.");
c("airspace", "What does a dashed magenta line around an airport mean?", "Class E surface area, extending to the surface for an instrument approach.", "Weather minimums there are Class E minimums even on the ground.");
c("airspace", "Where does Class E start when there's a magenta shaded (vignette) boundary?", "Class E begins at 700 ft AGL inside the shading; outside it, Class E starts at 1,200 ft AGL.");
c("airspace", "What is Class A and what do you need to fly there?", "18,000 ft MSL up to FL600. IFR only: instrument rating, IFR clearance, altimeter set to 29.92.");
c("airspace", "Restricted area: can you fly through it?", "Only with permission from the controlling agency, or when it's not active (check the chart legend and contact ATC or FSS). Hazards like artillery exist inside.");
c("airspace", "MOA: can you fly through it?", "Yes, VFR can enter a MOA, but exercise extreme caution and call the controlling agency or FSS to see if it's active. Military may be doing aerobatics at high speed.");
c("airspace", "Prohibited area?", "No flight permitted, ever, without special authorization. Example: P-40 Camp David.");
c("airspace", "What is a TFR and how do you check for one?", "Temporary Flight Restriction: stadiums, VIP movement, disasters, space ops. Check NOTAMs (tfr.faa.gov, ForeFlight) during preflight, every flight.", "Violating a VIP TFR gets you intercepted. It's a 91.103 preflight-action item.");
c("airspace", "Stadium TFR rule?", "No flight below 3,000 ft AGL within 3 nm of a major sporting event stadium (30,000+ seats) from one hour before to one hour after.");
c("airspace", "Speed limit below 10,000 ft MSL?", "250 knots indicated.");
c("airspace", "Speed limit in Class C or D surface area, or underneath Class B?", "200 knots indicated within 4 nm and 2,500 ft of the primary airport in C/D; 200 knots underneath Class B shelves or in a VFR corridor.");
c("airspace", "Where is a transponder with ADS-B Out required?", "Class A, B, C; within the Mode C veil; above 10,000 ft MSL (excluding below 2,500 AGL); and above Class B/C ceilings up to 10,000 ft.");
c("airspace", "What is an alert area?", "High volume of pilot training or unusual aerial activity. No restriction, just be alert.");
c("airspace", "What is a Military Training Route and what do the numbers mean?", "Low-altitude high-speed military routes. IR = IFR, VR = VFR. Four digits: entirely at or below 1,500 ft AGL. Three digits: some segments above 1,500 ft AGL.");
c("airspace", "Special VFR: what is it and can a student use it?", "A clearance to operate in a surface area with 1 SM visibility and clear of clouds. Private pilots can request it by day; at night you need an instrument rating and an IFR airplane. Students should not be requesting it.");

// ---------------- Weather ----------------
c("weather", "Decode: KCLT 251852Z 24012G18KT 10SM FEW045 SCT250 29/17 A3002", "Charlotte, 25th at 1852 Zulu, wind 240 at 12 gusting 18, 10 miles visibility, few clouds at 4,500, scattered at 25,000, temp 29 dew point 17, altimeter 30.02.");
c("weather", "What ceiling and visibility make it VFR, MVFR, IFR, LIFR?", "VFR: ceiling above 3,000 and vis above 5. MVFR: 1,000–3,000 or 3–5 SM. IFR: 500–999 or 1–3 SM. LIFR: below 500 or below 1 SM.", "A 'ceiling' is the lowest broken or overcast layer, not scattered.");
c("weather", "What's the difference between a METAR and a TAF?", "METAR is an observation (what is happening now, updated hourly). TAF is a forecast for a 5 SM radius around the airport, usually 24 or 30 hours.");
c("weather", "In a TAF, what does 'TEMPO 2022 4SM -SHRA BKN020' mean?", "Temporary conditions between 20Z and 22Z: 4 miles in light rain showers, broken at 2,000, lasting less than an hour at a time.");
c("weather", "Standard temperature and pressure at sea level?", "15 °C (59 °F) and 29.92 inHg (1013.2 hPa).");
c("weather", "Standard lapse rate?", "About 2 °C per 1,000 ft (3.5 °F). Pressure drops about 1 inch per 1,000 ft in the lower atmosphere.");
c("weather", "What is density altitude and why does it matter?", "Pressure altitude corrected for non-standard temperature: the altitude the airplane 'feels'. High DA means less thrust, less lift, longer takeoff, weaker climb.", "High, hot, humid: on a 95 °F day at 3,000 ft the 172 performs like it's at 6,000.");
c("weather", "What is the temperature/dew point spread telling you?", "How close the air is to saturation. A spread of 2–3 °C or less and falling means fog or low clouds are likely.");
c("weather", "Four types of fog?", "Radiation (clear calm night, cools from the ground), advection (warm moist air over a cold surface, common coastal), upslope (air forced up terrain), and steam/precipitation fog.");
c("weather", "Three ingredients for a thunderstorm?", "Moisture, unstable air, and a lifting action.");
c("weather", "Three stages of a thunderstorm and which is most dangerous?", "Cumulus (updrafts), mature (rain begins at the surface, updrafts and downdrafts, most violent), dissipating (downdrafts). Mature is worst.");
c("weather", "How far should you stay from a severe thunderstorm?", "At least 20 nm. Never fly under an anvil; hail can fall out of clear air.");
c("weather", "What is a microburst?", "An intense, localized downdraft under a thunderstorm; up to 6,000 fpm down and a 45-knot wind shear on the way in and out. Lasts 5–15 minutes.");
c("weather", "What weather comes with a cold front?", "Steep, fast-moving; cumulus clouds, showers and thunderstorms, gusty winds, a sharp wind shift and temperature drop, then clearing.");
c("weather", "What weather comes with a warm front?", "Shallow, slow; stratus clouds and steady precipitation ahead of it, low ceilings and poor visibility, possible freezing rain in winter.");
c("weather", "What indicates unstable air?", "Cumulus clouds, showery precipitation, turbulence, good visibility. Stable: stratus, steady rain, smooth air, poor visibility.");
c("weather", "Types of structural icing?", "Clear (large supercooled drops, spreads back, hard to see), rime (small drops, milky, brittle), mixed.");
c("weather", "Where does wind shear occur?", "Low-level temperature inversions, frontal zones, thunderstorms, and strong surface winds around terrain or buildings. It's a sudden change in wind speed or direction.");
c("weather", "What's a temperature inversion and what does it mean for you?", "Temperature increases with altitude. Smooth air but poor visibility trapped below; possible wind shear at the top.");
c("weather", "What does 'BKN008 OVC015' with '1/2SM FG' mean for a VFR flight?", "Ceiling 800 ft and half a mile in fog: LIFR. Not a VFR day. Don't go.");
c("weather", "What is a PIREP and how do you file one?", "A pilot report of actual conditions (turbulence, icing, cloud tops). Give it to Flight Service or ATC: location, time, altitude, type, conditions. UA is routine, UUA is urgent.");
c("weather", "What is an AIRMET vs a SIGMET?", "AIRMET: weather of concern to light aircraft (Sierra = IFR/mountain obscuration, Tango = turbulence/wind, Zulu = icing). SIGMET: significant weather for all aircraft (severe turbulence, icing, dust). Convective SIGMET: thunderstorms.");
c("weather", "How does the wind usually change from the surface to a few thousand feet?", "It veers (turns clockwise) and increases with altitude as surface friction drops out. Surface wind is about 30° off the winds-aloft direction.");
c("weather", "What is the freezing level and why do you care in a 172?", "The altitude where the temperature is 0 °C. Flight into visible moisture near or below freezing risks airframe ice; the 172S has no de-ice and icing is prohibited.");
c("weather", "Name three sources for a legal weather briefing.", "Flight Service (1-800-WX-BRIEF), 1800wxbrief.com/Leidos, and aviationweather.gov; apps like ForeFlight can also record the briefing.");

// ---------------- Regs ----------------
c("regs", "What documents must be on board the airplane? (ARROW)", "Airworthiness certificate, Registration, Radio station license (only international), Operating limitations (POH/AFM, placards), Weight and balance.");
c("regs", "What documents must the pilot carry?", "Pilot certificate, medical certificate (or BasicMed docs), government photo ID. Students also carry their logbook with endorsements on solo flights.");
c("regs", "Required inspections? (AV1ATES)", "Annual (12 months), VOR check (30 days, IFR only), 100-hour (if for hire/instruction in a rental), Altimeter/pitot-static (24 months, IFR), Transponder (24 months), ELT (12 months, battery at 1 hour cumulative use or 50% shelf life), Static system (with altimeter).");
c("regs", "Required equipment for day VFR? (ATOMATOFLAMES)", "Airspeed, Tachometer, Oil pressure, Manifold pressure (if applicable), Altimeter, Temperature (liquid cooled), Oil temperature, Fuel gauges, Landing gear position lights (if retractable), Anticollision lights, Magnetic compass, ELT, Seat belts.");
c("regs", "Additional equipment for night VFR? (FLAPS)", "Fuses (spare set or three of each kind), Landing light (if for hire), Anticollision lights, Position lights, Source of electrical power.");
c("regs", "What can you do if a piece of equipment is inoperative? (91.213)", "If it's not required by 91.205, the type certificate, an AD, or the equipment list, you may placard it INOPERATIVE and deactivate or remove it, with a determination it's safe. Otherwise it's grounded or needs a ferry permit.");
c("regs", "Fuel reserves for VFR?", "Enough to reach the destination plus 30 minutes at normal cruise by day, 45 minutes at night.");
c("regs", "Minimum safe altitude over a congested area?", "1,000 ft above the highest obstacle within a 2,000-ft horizontal radius.");
c("regs", "Minimum safe altitude over non-congested areas and sparsely populated areas?", "500 ft AGL over non-congested; over open water or sparsely populated areas, not closer than 500 ft to any person, vessel, vehicle or structure. Anywhere: high enough to make an emergency landing without undue hazard.");
c("regs", "VFR cruising altitudes above 3,000 ft AGL?", "Magnetic course 0–179: odd thousands plus 500 (3,500, 5,500). 180–359: even thousands plus 500 (4,500, 6,500).", "East is odd. People are odd. That's the memory hook.");
c("regs", "Who has the right of way: airplane versus glider, balloon, airship?", "Balloon over glider over airship over airplane/rotorcraft. Aircraft in distress over everyone. Aircraft towing or refueling over other engine-driven aircraft.");
c("regs", "Two airplanes converging at the same altitude, who yields?", "The aircraft on the other's right has the right of way. Head-on: both turn right. Overtaking: pass on the right. On final: the lower aircraft has the right of way, but don't abuse it to cut someone off.");
c("regs", "Passenger currency requirements?", "Three takeoffs and landings within the preceding 90 days in the same category and class. At night: three full-stop landings at night in the preceding 90 days (one hour after sunset to one hour before sunrise).");
c("regs", "What does a third-class medical let you do and how long is it valid?", "Private pilot privileges. Valid 60 months if you were under 40 on the exam date, 24 months if 40 or over.");
c("regs", "What is a flight review and how often?", "One hour ground and one hour flight with a CFI every 24 calendar months (61.56). A new certificate or rating resets it.");
c("regs", "As a student pilot, what can't you do? (61.89)", "Carry passengers, fly for hire, fly with less than 3 SM visibility (5 at night), fly above an overcast or without visual reference to the surface, fly against your endorsements' limitations, fly internationally, or fly when the CFI says no.");
c("regs", "As a private pilot, can you be paid to fly?", "Not for compensation or hire, with exceptions: pro-rata share of operating expenses (fuel, oil, airport fees, rental) with passengers, charity flights under rules, and a few others. You must be paying at least your equal share.");
c("regs", "Alcohol rules?", "No flying within 8 hours of drinking, with a blood alcohol of 0.04 or higher, or while under the influence. Company/instructor rules may be stricter (12 or 24 hours).");
c("regs", "When is supplemental oxygen required?", "Crew: above 12,500 ft MSL cabin altitude for more than 30 minutes; above 14,000 all the time. Passengers must be provided oxygen above 15,000.");
c("regs", "What must you report to the NTSB immediately?", "Accidents (death, serious injury, substantial damage) and certain incidents: flight control malfunction, crew unable to perform duties, in-flight fire, mid-air collision, damage over $25,000 to other property, and others in NTSB 830.5.");
c("regs", "What does 91.103 say you must know before a flight?", "All available information: weather, fuel requirements, alternates, known traffic delays, runway lengths, and takeoff/landing distance data. (NWKRAFT: NOTAMs, Weather, Known ATC delays, Runway lengths, Alternates, Fuel, Takeoff/landing distances.)");
c("regs", "What is the PIC's authority under 91.3?", "Directly responsible for and the final authority on the operation of the aircraft. In an emergency you may deviate from any rule to the extent required, and may be asked for a written report.");
c("regs", "When must you wear seatbelts and brief passengers?", "Crew: belts fastened at their stations during takeoff and landing, and en route; shoulder harness for takeoff and landing if installed. Brief passengers on belts, and ensure they're fastened for taxi, takeoff and landing.");
c("regs", "How long is a sectional chart valid?", "56 days. Check the edition date; flying with an expired chart is asking for an airspace violation.");
c("regs", "What is an Airworthiness Directive (AD)?", "A legally mandatory FAA notice to correct an unsafe condition. Compliance is the owner/operator's responsibility; recurring ADs need repeated compliance. Check the logbooks.");
c("regs", "What is the difference between a standard and a special airworthiness certificate?", "Standard (white) for normal/utility/acrobatic etc. certified aircraft. Special (pink) for experimental, restricted, light-sport, etc.");
c("regs", "What are the categories of airspace weather you need to fly over the top of a cloud layer as a private pilot?", "Legal if you maintain VFR cloud clearances and visibility, but you must be able to descend VFR at the destination; a student pilot may not fly above a layer without visual reference to the surface.");
c("regs", "Transponder codes: 1200, 7500, 7600, 7700?", "1200 VFR. 7500 hijack. 7600 lost communications. 7700 emergency.");
c("regs", "What are the ELT rules?", "Required for most flights (91.207). Battery replaced after 1 cumulative hour of use or 50% of useful life. Test in the first 5 minutes after the hour, three sweeps. Check it hasn't been triggered after a hard landing (listen on 121.5).");
c("regs", "What logbook entry lets a student solo, and how long is it good?", "A pre-solo knowledge test, training in the make and model, and an endorsement on the student certificate plus a logbook endorsement valid for 90 days from the same CFI.");

// ---------------- Systems (172S) ----------------
c("systems", "What engine is in the 172S and how much power does it make?", "Lycoming IO-360-L2A, 4-cylinder, horizontally opposed, air-cooled, fuel-injected, 180 hp at 2,700 rpm.");
c("systems", "What does 'IO' mean in IO-360?", "I = fuel Injected, O = horizontally Opposed cylinders. 360 is the displacement in cubic inches.");
c("systems", "Why is there no carburetor heat in the 172S?", "It's fuel injected, so there's no carburetor venturi to ice. Induction icing is still possible; the alternate air door handles a blocked filter.");
c("systems", "What does the aux fuel pump do and when do you use it?", "An electric boost pump that pressurizes the fuel lines. Used for priming at start, and if the engine-driven pump fails or for vapor suppression on hot days. It's not on for normal takeoff.");
c("systems", "Describe the 172S fuel system.", "Two wing tanks, 56 gal total, 53 usable, gravity fed through a selector (LEFT/RIGHT/BOTH), a reservoir, the fuel shutoff valve, the electric aux pump, the engine-driven pump, and the injector servo. 13 sump drains: 5 per wing, 3 under the cowl.");
c("systems", "Why do we take off and land with the fuel selector on BOTH?", "So a blocked or empty tank can't starve the engine at a critical moment. Uneven feeding in cruise is normal; switch to the fuller tank only in level flight.");
c("systems", "What grade of fuel, and what color?", "100LL, blue. 100 (green) is acceptable. Jet A is clear/straw colored and smells like kerosene; it will kill a piston engine.");
c("systems", "What are you checking when you sump the fuel?", "Water (settles at the bottom as a clear bubble), sediment, and correct color/smell. Sump after every fueling and before the first flight of the day.");
c("systems", "Describe the electrical system.", "28-volt DC, a 60-amp engine-driven alternator, and a 24-volt battery. Master switch has BAT and ALT halves. Avionics have a separate master. Circuit breakers protect each circuit.");
c("systems", "What happens if the alternator fails?", "The battery carries everything and drains: the ammeter shows discharge and the low-voltage light comes on. Turn off non-essential loads, cycle the ALT switch once, and land as soon as practical. Expect roughly 30 minutes.");
c("systems", "What do the magnetos do, and what happens if the battery dies in flight?", "Two independent magnetos generate spark from engine rotation; they don't need the battery. The engine keeps running; you lose radios, transponder, flaps, and lights.");
c("systems", "Why do we check the mags at 1,800 rpm, and what are the limits?", "To confirm both ignition systems work under load. Max drop 150 rpm on either mag, max 50 rpm difference between them. No drop means a mag isn't grounding (hot mag).");
c("systems", "Which instruments run on the vacuum system?", "Attitude indicator and heading indicator. The engine-driven vacuum pump spins their gyros; the suction gauge should read about 4.5–5.5 inHg.");
c("systems", "Which instrument is electrically driven?", "The turn coordinator. That's why it keeps working if the vacuum pump fails, and why you cross-check it against the attitude indicator.");
c("systems", "Which instruments use the pitot-static system?", "Airspeed indicator (pitot and static), altimeter (static), vertical speed indicator (static).");
c("systems", "Pitot tube blocked, drain hole open: what does the airspeed do?", "Reads zero (ram pressure bleeds out the drain).");
c("systems", "Pitot tube and drain both blocked: what does the airspeed do?", "Acts like an altimeter: increases in a climb, decreases in a descent. Dangerous in a climb because it looks like you're accelerating.");
c("systems", "Static port blocked: what happens?", "Altimeter freezes at the blockage altitude, VSI reads zero, airspeed reads low above that altitude and high below it. Use the alternate static source; expect small errors.");
c("systems", "What are the airspeed indicator color arcs?", "White: flap operating range (Vs0 to Vfe). Green: normal range (Vs1 to Vno). Yellow: caution, smooth air only (Vno to Vne). Red line: Vne.");
c("systems", "How does the altimeter work?", "An aneroid wafer expands and contracts with static pressure and drives the needles. Set the Kollsman window to the local altimeter setting so it reads MSL.");
c("systems", "What is the altimeter error from 'high to low'?", "Flying from high pressure to low pressure (or warm to cold) without resetting, the altimeter reads higher than you are. 'High to low, look out below.'");
c("systems", "What are the magnetic compass errors?", "Variation, deviation, magnetic dip, and turning/acceleration errors: ANDS (Accelerate North, Decelerate South) and UNOS (Undershoot North, Overshoot South) in the northern hemisphere.");
c("systems", "What does the heading indicator need from you?", "Reset it to the magnetic compass in straight-and-level unaccelerated flight every 15 minutes; it precesses about 3° per 15 minutes.");
c("systems", "How does the stall warning horn work in a 172?", "A reed in the leading edge of the left wing. As angle of attack increases the stagnation point moves down and air is sucked through the reed. It sounds 5–10 knots before the stall. Test by sucking on it during preflight.");
c("systems", "How do the flaps work and what are the settings?", "Electric, single-slotted, 0/10/20/30° with a preselect lever. Vfe: 110 knots for 10°, 85 knots for 20–30°.");
c("systems", "How is the nose wheel steered?", "Rudder pedals through a spring link, about 10° each way; differential braking gives more. It free-casters up to 30°.");
c("systems", "Describe the brake system.", "Hydraulic disc brakes on the main wheels only, actuated by toe brakes on the rudder pedals (both seats). The parking brake holds pressure with a pull knob.");
c("systems", "Oil capacity and minimum?", "8 quarts in the sump (9 with filter). Don't fly below 5; most schools want 6–7. Check with the dipstick after the engine sits.");
c("systems", "What does the mixture control do and when do you lean?", "Sets the fuel-to-air ratio. Lean above 3,000 ft density altitude in cruise, and for taxi/run-up at high elevations, to avoid fouled plugs and wasted fuel. Full rich for takeoff below 3,000 ft DA.");
c("systems", "What does the primer do on the 172S?", "Trick question: there isn't one. Priming is done with the aux fuel pump and mixture (mixture rich until fuel flow, then idle cutoff, pump off).");
c("systems", "What is the ELT and where is it?", "Emergency Locator Transmitter, in the tailcone. Activates on impact (G switch) or with the cockpit remote switch, broadcasting on 121.5 and 406 MHz.");
c("systems", "What is the alternate static source and where is it?", "A valve in the cabin (left of the pilot) that lets the static instruments use cabin pressure if the external port ices or clogs. Expect the altimeter to read a bit high and airspeed a bit high.");
c("systems", "What does the low-voltage light mean?", "Bus voltage has dropped below about 24.5 volts: the alternator isn't charging. Check the ammeter, reduce load, cycle ALT.");
c("systems", "Where is fuel vented and why do you check it?", "A vent under the left wing (the right tank vents through the left via a crossover) plus vented caps. A blocked vent can collapse a tank or starve the engine.");

// ---------------- Aerodynamics ----------------
c("aero", "What are the four forces and when are they equal?", "Lift, weight, thrust, drag. In unaccelerated straight-and-level flight, lift equals weight and thrust equals drag.");
c("aero", "What is angle of attack?", "The angle between the chord line of the wing and the relative wind. Not pitch attitude, not flight path.");
c("aero", "When does a wing stall?", "When it exceeds its critical angle of attack, about 16–18° in a 172. At any airspeed, any attitude, any weight.", "That's why you can stall at 100 knots in a steep pull-up. Airspeed is a proxy; AoA is the truth.");
c("aero", "What is load factor and what is it in a 60° bank level turn?", "Lift divided by weight, in Gs. At 60° bank it's 2 G. At 45° it's 1.41 G.");
c("aero", "How does stall speed change with load factor?", "It increases with the square root of the load factor. At 2 G (60° bank), Vs goes up 41%: a 48-knot stall becomes about 68.");
c("aero", "What is Va and why does it decrease with weight?", "Maneuvering speed: the max speed for full abrupt control deflection. A lighter airplane reaches the limit load factor at a lower speed because the wing can generate more Gs relative to the lighter weight before stalling. 172S: 105 at 2,550 lb, 90 at 1,900 lb.");
c("aero", "Name the four left-turning tendencies.", "Torque (reaction to the prop), P-factor (descending blade makes more thrust at high AoA), spiraling slipstream (hits the left side of the vertical fin), gyroscopic precession (mostly when the tail comes up in taildraggers).");
c("aero", "What is adverse yaw and how do you fix it?", "The down aileron on the rising wing makes more drag, yawing the nose away from the turn. Fix it with rudder in the direction of the turn as you roll in.");
c("aero", "What is ground effect?", "Within about one wingspan of the ground, downwash and wingtip vortices are reduced, so induced drag drops and the airplane floats or can lift off before it can climb.");
c("aero", "Where are wingtip vortices worst and how do you avoid them?", "Heavy, slow, clean aircraft. Vortices sink and drift with the wind. Take off before the heavy's rotation point and climb above its path; land beyond its touchdown point. Wait 2–3 minutes behind large aircraft.");
c("aero", "Forward CG effects?", "More stable, higher stall speed, more elevator needed to flare, worse cruise performance, harder to rotate.");
c("aero", "Aft CG effects?", "Less stable, lower stall speed, better cruise, but stall and spin recovery may be difficult or impossible. Aft is the dangerous one.");
c("aero", "What do flaps do?", "Increase camber (and area for slotted/Fowler): more lift and more drag at a given airspeed, lower stall speed, steeper approach without more speed, better view over the nose.");
c("aero", "What is the difference between induced and parasite drag?", "Induced drag comes from making lift and is highest at low speed/high AoA. Parasite drag comes from form, skin friction and interference and increases with the square of airspeed. Total drag is lowest at L/D max.");
c("aero", "What is L/D max and why does it matter?", "The angle of attack with the best lift-to-drag ratio. Flying it gives the best glide (68 knots in the 172S) and max range.");
c("aero", "Does best glide speed change with weight? With wind?", "Yes with weight: lower when lighter. Best glide is an AoA; POH speeds are for max gross. With a headwind, add a bit of speed to cover more ground; with a tailwind, slow slightly.");
c("aero", "What is the region of reversed command?", "Slow flight below L/D max, where flying slower needs MORE power. Pitch controls airspeed and power controls altitude, and things get 'backwards' near the stall.");
c("aero", "What causes a spin?", "A stall with yaw: one wing more stalled than the other. Recovery: PARE. Prevention: coordination, especially base to final.");
c("aero", "Why does frost on the wings matter?", "Even a thin layer disrupts airflow, reduces lift up to 30% and increases drag; the wing stalls at a lower AoA. Remove all of it.");
c("aero", "What is static vs dynamic stability?", "Static: the initial tendency to return toward equilibrium. Dynamic: what the oscillation does over time (damps out, stays, or grows). The 172 is positively stable in both, which is why it's a trainer.");
c("aero", "Why do you add right rudder in a climb?", "P-factor and slipstream are strongest at high power and high AoA; without right rudder the ball goes left and the nose yaws left.");
c("aero", "What is an accelerated stall?", "A stall at higher than 1 G, so at a higher airspeed than the 1-G stall speed: pulling hard in a steep turn or out of a dive.");
c("aero", "In a level turn, why does the airplane need more back pressure?", "Part of the lift is tilted into the turn, so total lift must increase to keep the vertical component equal to weight. That's the increased load factor.");
c("aero", "What is the relationship between airspeed, angle of attack and lift?", "Lift = ½ ρ V² S CL. Slower needs more CL (higher AoA) for the same lift; double the speed gives four times the lift at the same AoA.");
c("aero", "Why does a heavier airplane stall at a higher airspeed?", "It needs more lift, so at the critical AoA it needs more dynamic pressure: the same CLmax at a higher V.");

// ---------------- Performance & W&B ----------------
c("performance", "How do you find pressure altitude?", "Set the altimeter to 29.92 and read it, or compute: (29.92 − altimeter setting) × 1,000 + field elevation.");
c("performance", "Rule of thumb for density altitude?", "About 120 ft per °C above standard at that pressure altitude. Standard at sea level is 15 °C, minus 2 °C per 1,000 ft.");
c("performance", "What is the 50/70 rule?", "If you haven't reached 70% of rotation speed by 50% of the runway, abort the takeoff.");
c("performance", "Effect of a 10% tailwind on takeoff distance?", "A tailwind of 10% of liftoff speed increases takeoff distance about 20%; a 10% headwind reduces it about 10%.");
c("performance", "Estimate crosswind component quickly.", "30° off the runway: half the wind. 45°: 70%. 60° or more: treat it as all crosswind. Wind 20 knots at 30° = 10 knots crosswind.");
c("performance", "Is 15 knots the 172's crosswind limitation?", "No. It's the maximum DEMONSTRATED crosswind from certification, not a limit. Your personal minimums and the school's rules are what matter.");
c("performance", "What is the arm, the moment, and CG?", "Arm: distance from the datum. Moment: weight × arm. CG: total moment divided by total weight. It must fall inside the envelope at takeoff and at landing.");
c("performance", "Max gross weight of the 172S, and what if you're over?", "2,550 lb. Longer takeoff, weaker climb, higher stall speed, structural margins reduced, and it's illegal. Take fuel out or a person out, not both usually.");
c("performance", "Fuel weight and oil weight?", "Avgas 6 lb/gal, oil 7.5 lb/gal (1.875 lb/qt).");
c("performance", "Full fuel in a 172S weighs how much and what's left for people and bags?", "53 usable gal ≈ 318 lb (56 total ≈ 336). With a typical empty weight around 1,680 lb, that leaves about 550 lb for people and bags at max gross.");
c("performance", "What factors increase landing distance?", "Higher density altitude, tailwind, extra approach speed (biggest one: 10% fast is 20% more distance), heavier weight, downslope, wet or contaminated runway, poor braking.");
c("performance", "What is the 172S service ceiling and what does it mean?", "About 14,000 ft: the altitude where the max rate of climb drops to 100 fpm. Absolute ceiling is where climb is zero.");
c("performance", "How much fuel does the 172S burn?", "About 8.5 gph at 75% power leaned, more like 10 at full rich. 53 usable gives roughly 5 hours plus reserve at cruise.");
c("performance", "What speeds give best range and best endurance?", "Best range: L/D max (about 68 knots in a 172, faster with a headwind). Best endurance: minimum power required, slower still. Neither is a normal cruise speed.");
c("performance", "Why do you interpolate on performance charts, and which way do you round?", "Conditions rarely match the chart lines; interpolate between them. When in doubt, round toward the conservative number (more distance, less performance).");
c("performance", "Effect of a soft or grass runway on takeoff distance?", "Increases it: POH says about 15% more ground roll on dry grass. Wet grass or mud is worse; use the soft-field technique.");
c("performance", "What is the datum on the 172S?", "The front face of the firewall. All arms are measured aft of it; the CG range is roughly 35–47.3 inches at max gross.");
c("performance", "Baggage limits in the 172S?", "120 lb total in the baggage compartment (areas 1 and 2 with area 2 limited to 50 lb), and never exceed the CG envelope.");

// ---------------- Airport ops ----------------
c("airport", "How are runways numbered?", "By magnetic heading rounded to the nearest 10°, with the last zero dropped. Runway 20 points about 200° magnetic; the reciprocal is runway 2.");
c("airport", "What does a displaced threshold mean?", "The landing threshold is moved down the runway (white arrows lead to it). You can taxi and take off on the displaced part, and use it for rollout, but not land on it.");
c("airport", "Yellow chevrons at the end of a runway?", "A blast pad or stopway: unusable for taxi, takeoff, or landing.");
c("airport", "What does a sign with black letters on a yellow background mean?", "Direction/destination sign: points toward that taxiway. Yellow on black is a location sign (where you are). White on red is mandatory (hold short of a runway or ILS critical area).");
c("airport", "Describe a runway hold-short marking.", "Two solid and two dashed yellow lines. Solid lines on your side: stop unless cleared. Dashed on your side: you're on the runway, cross to clear it.");
c("airport", "Runway edge lights change color near the end: what does it mean?", "White, then amber for the last 2,000 ft (or last half of a short runway) as a caution zone. Centerline lights (if installed) alternate red/white in the last 3,000 ft and go all red for the last 1,000.");
c("airport", "What do the colors of taxiway lights mean?", "Blue edge lights, green centerline lights. Clearance bar and runway guard lights are yellow.");
c("airport", "PAPI: two red, two white?", "On glidepath. Three or four white: high. Three or four red: low. VASI: 'red over white, you're all right; white over white, you're high as a kite; red over red, you're dead.'");
c("airport", "What does a rotating beacon during the day tell you?", "At an airport in Class B, C, D or E surface area, the beacon on in daytime means the weather is below basic VFR minimums (ceiling under 1,000 or visibility under 3).");
c("airport", "Beacon colors?", "White/green: lighted civilian land airport. White/yellow: water. Green/yellow/white: heliport. Two white plus green: military.");
c("airport", "What is the segmented circle and what do the L-shaped indicators mean?", "A visual pattern indicator at non-towered fields. The L shapes show which way the traffic pattern turns for each runway (the long leg is the runway, the short leg is base).");
c("airport", "Standard traffic pattern altitude and direction?", "1,000 ft AGL (unless published) and left turns, unless right traffic is indicated (RP in the Chart Supplement or the segmented circle).");
c("airport", "How do you enter a non-towered traffic pattern?", "At pattern altitude on a 45° to the midfield downwind. If crossing overfield, do it 500 ft above pattern altitude, descend on the upwind side, then enter the 45.");
c("airport", "What should every CTAF call include?", "Who you're calling (airport name), who you are, where you are, what you're doing, and the airport name again. 'Concord traffic, Skyhawk 12345, left downwind runway 20, full stop, Concord.'");
c("airport", "How do you turn on pilot-controlled lighting?", "Key the mic on the CTAF/published frequency: 7 clicks for high intensity, 5 for medium, 3 for low, within 5 seconds. They stay on 15 minutes.");
c("airport", "What must you read back to ground/tower?", "Runway assignments, hold-short instructions, and 'line up and wait', with your callsign. Read back the runway number in every taxi and takeoff clearance.");
c("airport", "What is LAHSO and should you accept it?", "Land and Hold Short Operations: landing with a clearance to hold short of an intersecting runway. The PIC may decline. Student pilots should not accept LAHSO.");
c("airport", "Light gun signals on the ground: steady green, flashing green, steady red, flashing red, flashing white, alternating red/green?", "Steady green: cleared for takeoff. Flashing green: cleared to taxi. Steady red: stop. Flashing red: taxi clear of the runway. Flashing white: return to start. Alternating red/green: extreme caution.");
c("airport", "Light gun signals in flight: steady green, flashing green, steady red, flashing red, alternating?", "Steady green: cleared to land. Flashing green: return for landing. Steady red: give way, keep circling. Flashing red: airport unsafe, do not land. Alternating red/green: extreme caution.");
c("airport", "What's the difference between ATIS, AWOS and ASOS?", "ATIS: recorded info at towered airports, updated hourly or as needed, with a phonetic letter. AWOS/ASOS: automated weather observation, updated every minute, at non-towered fields too.");
c("airport", "What is a runway incursion and the best defense?", "Any unauthorized aircraft, vehicle or person on a runway. Defense: airport diagram out, read back hold-shorts, look before crossing, 'sterile' cockpit, ask if unsure, never cross a hold line without clearance.");
c("airport", "What does 'taxi via Alpha, hold short runway 20' require?", "Taxi on Alpha only, stop before the hold-short line for runway 20, and read back 'hold short runway 20' with your callsign.");
c("airport", "What does 'line up and wait' mean?", "Taxi onto the runway and hold position, not cleared for takeoff. If you sit more than about 90 seconds, query the tower.");
c("airport", "Wind sock: how do you read it?", "It points away from the wind (the wind blows into the wide end). Fully extended is about 15 knots or more. Land into the wind.");
c("airport", "What is a hot spot on an airport diagram?", "A location with a history of runway incursions or confusing geometry, marked HS1, HS2 on the diagram. Extra caution there.");

// ---------------- Emergency ----------------
c("emergency", "Engine failure in cruise: first action?", "Pitch and trim for best glide, 68 knots. Then pick a field. Then the restart flow. Fly the airplane first.");
c("emergency", "What are the ABCDE steps for an engine failure?", "Airspeed (best glide), Best field, Checklist (restart), Declare (121.5, 7700), Execute (secure and land).");
c("emergency", "Engine fails right after takeoff at 300 ft: what do you do?", "Pitch down immediately to 70 (65 with flaps), land straight ahead within about 30° either side. No turn back. Mixture cutoff, fuel off, mags off, master off, door unlatched if time.");
c("emergency", "What altitude do you need before considering a turn back to the runway?", "Most schools brief at least 1,000 ft AGL in a 172, and only if you've practiced it at altitude. Below that, straight ahead.");
c("emergency", "Fuel starvation vs fuel exhaustion?", "Exhaustion: no fuel left. Starvation: fuel is on board but not reaching the engine (selector, shutoff, blocked vent, water). Starvation is why the restart flow starts with fuel.");
c("emergency", "Engine fire in flight: what's the flow?", "Mixture idle cutoff, fuel shutoff OFF, master OFF, cabin heat and air OFF, airspeed 100 knots (more if the fire won't go out), then a forced landing. Do not restart.");
c("emergency", "Electrical fire in flight?", "Master OFF, vents closed, fire extinguisher, avionics OFF, all other switches OFF. After the fire's out: vents open, master ON, breakers checked, radios ON one at a time. Land as soon as practical.");
c("emergency", "What does MAYDAY mean versus PAN-PAN?", "MAYDAY (three times): distress, immediate danger, need immediate help. PAN-PAN (three times): urgency, a serious situation without immediate danger. Say it on the frequency you're on, or 121.5.");
c("emergency", "What do you tell ATC in an emergency?", "Who you are, where you are, what's wrong, what you want to do, and souls and fuel on board. Then fly the airplane; they'll ask for the rest.");
c("emergency", "Lost: the five Cs?", "Climb (better radio and view), Communicate (121.5 or FSS/ATC), Confess (say you're lost), Comply (do what they say), Conserve (lean the mixture, slow down).");
c("emergency", "Inadvertent flight into a cloud as a VFR pilot?", "Trust the instruments, keep wings level on the attitude indicator, make a standard-rate 180° turn back to VFR, call ATC. 178 seconds is the average survival time for a VFR pilot in IMC without training.");
c("emergency", "What does the ELT transmit on and how do you check it after a hard landing?", "121.5 MHz (and 406 MHz to satellites). Listen on 121.5 after landing; if you hear the sweeping tone, turn it off with the remote switch and tell FSS.");
c("emergency", "Carbon monoxide poisoning: symptoms and response?", "Headache, drowsiness, dizziness, blue lips; the CO detector spot darkens. Cabin heat OFF, vents open, land. It comes from an exhaust leak into the heater shroud.");
c("emergency", "Door pops open on takeoff. What do you do?", "Fly the airplane. It's loud and drafty, not dangerous. Continue the pattern, land, close it. Don't try to close it while flying.");
c("emergency", "Alternator fails at night, 30 minutes from home?", "Load shed: everything off except one radio, transponder, and nav lights as needed. Consider landing sooner. Battery gives roughly 30 minutes; the engine keeps running.");
c("emergency", "What is the emergency descent technique in a 172?", "Power idle, flaps up, bank 30–45°, pitch for about 120 knots (never above Vno in turbulence), clear below, level off with room to spare.");
c("emergency", "Partial power loss: rough engine at 2,000 ft over the practice area?", "Best glide attitude ready, mixture rich, fuel selector both, check mags one at a time (a bad mag may run better on one), aux pump on, head for the nearest runway. Don't trust a rough engine to keep making power.");
c("emergency", "What squawk if your radio fails, and what do you do at a towered airport?", "7600. Continue inbound, enter the pattern, watch the tower for light signals, rock your wings to acknowledge by day (flash landing light at night).");
c("emergency", "Wake turbulence encounter on final: how do you avoid it?", "Stay above the preceding heavy's flight path, land beyond its touchdown point, and wait for the wind to blow the vortices off the runway. Departing: rotate before its rotation point and climb above its path.");
c("emergency", "Landing gear? Flaps fail to extend: what changes?", "Fixed gear, so nothing there. No flaps: approach at 65–70, flatter approach, longer float and rollout, be careful of a nose-high flare; pick a longer runway.");

// ---------------- Aeromedical & ADM ----------------
c("aeromedical", "Four types of hypoxia?", "Hypoxic (not enough O2 in the air: altitude), hypemic (blood can't carry it: CO, anemia), stagnant (poor circulation: G forces, cold), histotoxic (cells can't use it: alcohol, drugs).");
c("aeromedical", "Hypoxia symptoms?", "Euphoria, headache, tingling, blue fingernails, tunnel vision, impaired judgment. It sneaks up on you; night vision degrades from 5,000 ft.");
c("aeromedical", "Hyperventilation: cause and cure?", "Breathing too fast from stress or fear; blows off CO2. Symptoms mimic hypoxia. Slow the breathing, talk out loud, breathe into a bag. If on oxygen and unsure, keep it on.");
c("aeromedical", "What is IMSAFE?", "Illness, Medication, Stress, Alcohol, Fatigue, Emotion/Eating. A self-check before every flight.");
c("aeromedical", "What is PAVE?", "Pilot, Aircraft, enVironment, External pressures: the four risk categories to assess before a flight.");
c("aeromedical", "What are the five hazardous attitudes and their antidotes?", "Anti-authority (follow the rules), Impulsivity (not so fast, think first), Invulnerability (it could happen to me), Macho (taking chances is foolish), Resignation (I'm not helpless, I can make a difference).");
c("aeromedical", "What is the DECIDE model?", "Detect, Estimate, Choose, Identify, Do, Evaluate. A structured way through an in-flight decision.");
c("aeromedical", "Scuba diving before flying: how long?", "At least 12 hours after a dive not requiring a decompression stop for flights below 8,000 ft; 24 hours if a decompression stop was required or the flight goes above 8,000.");
c("aeromedical", "What is the 'leans'?", "After a slow roll into a bank the inner ear stops sensing it; when you level, you feel banked the other way and lean. Trust the attitude indicator.");
c("aeromedical", "What is a graveyard spiral?", "In a prolonged coordinated turn the ear stops sensing the turn; the pilot feels the nose drop, pulls, and tightens the descending spiral. Level the wings first, then pull.");
c("aeromedical", "Somatogravic illusion?", "Rapid acceleration (like a go-around) feels like pitching up, so the pilot pushes over into the ground. Deceleration feels like pitching down. Trust the instruments.");
c("aeromedical", "Coriolis illusion?", "Moving your head quickly during a turn causes an overwhelming tumbling sensation. Keep head movements slow and small in the clouds.");
c("aeromedical", "Runway illusions: narrow runway, wide runway, upslope, downslope?", "Narrow or upslope runway: you feel high and fly a low approach. Wide or downslope: you feel low and fly high. Use the PAPI and known pattern numbers.");
c("aeromedical", "How long does it take eyes to fully dark-adapt, and how do you protect it?", "About 30 minutes. Avoid bright white light, use red or dim lighting, and use off-center viewing (rods) at night. Oxygen helps above 5,000 ft at night.");
c("aeromedical", "Ear block on descent: what do you do?", "Valsalva (pinch nose, gently blow), swallow, yawn, slow the descent or level off. Don't fly with a cold.");
c("aeromedical", "What is spatial disorientation and how do you prevent it?", "Not knowing the airplane's attitude because the inner ear and body are being fooled. Prevent it by staying VFR, trusting the instruments, and avoiding sudden head movements.");
c("aeromedical", "What medications are a problem?", "Anything sedating: antihistamines, sleep aids, many cold medicines, muscle relaxants. Wait 5 dosing intervals after the last dose. When in doubt, ask an AME.");
c("aeromedical", "What is a personal minimums checklist?", "Your own weather, wind, and currency limits, set on the ground when you're calm, stricter than the regs. Example: 10-knot crosswind, 3,000-ft ceiling, 6 SM as a new pilot.");
c("aeromedical", "Signs of fatigue and why it matters for a flight attendant who flies for fun?", "Slow reactions, fixation, skipped checklist items, poor judgment. Coming off a duty day counts; treat it like alcohol. Don't schedule a lesson after a red-eye.");
c("aeromedical", "What is CRM/SRM for a single pilot?", "Single-pilot resource management: using everything available (ATC, checklists, passengers, autopilot, flight following) to manage workload and risk.");

// ---------------- Navigation & comms ----------------
c("navigation", "What is magnetic variation and how do you apply it?", "The angle between true north and magnetic north, shown by isogonic lines. True course ± variation = magnetic course. 'East is least (subtract), west is best (add).' Charlotte is about 7° W.");
c("navigation", "What is deviation?", "Compass error from the airplane's own magnetic fields, shown on the compass card. Magnetic heading ± deviation = compass heading.");
c("navigation", "True course to compass heading: the chain?", "TC ± WCA = TH; TH ± VAR = MH; MH ± DEV = CH.");
c("navigation", "How does a VOR work in one sentence?", "It broadcasts a reference and a variable phase signal; the receiver measures the phase difference to give your radial (bearing FROM the station).");
c("navigation", "VOR: what does the CDI show and what is full-scale deflection?", "Course deviation, 2° per dot, 10° full scale. Center the needle with a FROM flag and the OBS reads your radial.");
c("navigation", "What is reverse sensing?", "When you fly a radial with the OBS set to the reciprocal (wrong TO/FROM), the needle moves opposite to the correction. Set the OBS to the course you're flying.");
c("navigation", "VOR service volumes for the standard classes?", "Terminal: 25 nm, 1,000–12,000 ft. Low: 40 nm, 1,000–18,000 ft. High: 40 nm to 14,500, 100 nm to 18,000, 130 nm up to FL450.");
c("navigation", "Sectional: what does a magenta airport symbol vs a blue one mean?", "Blue: towered airport. Magenta: non-towered. A circle with runways drawn means hard-surfaced runway over 8,069 ft; a plain circle means shorter or unpaved. Ticks around it: fuel and services.");
c("navigation", "What is the MEF on a sectional?", "Maximum Elevation Figure, in each quadrangle: the highest terrain or obstacle plus a margin, in thousands and hundreds of feet MSL. Fly above it for guaranteed clearance.");
c("navigation", "What is the 1-in-60 rule?", "One degree of heading error puts you about one mile off course after 60 miles. Ten miles off after 60 = 10° correction to parallel, plus the same again to converge.");
c("navigation", "How do you estimate time to a checkpoint?", "Distance ÷ groundspeed × 60. At 100 knots groundspeed, 25 nm takes 15 minutes. Compare actual to planned at every checkpoint.");
c("navigation", "What is pilotage vs dead reckoning?", "Pilotage: navigating by visual landmarks. Dead reckoning: computing headings and times from course, wind, speed and time. Use both together.");
c("navigation", "How do you get VFR flight following and what does it give you?", "Call Charlotte Approach with callsign, type, position, altitude, destination, and 'request flight following'. You get a squawk and traffic advisories on a workload-permitting basis. It's not a clearance into Bravo.");
c("navigation", "What do you say to open, and how do you close, a VFR flight plan?", "File with Flight Service or an app; activate airborne via FSS or the app. Close after landing by phone or app. If you don't, search and rescue starts 30 minutes after your ETA.");
c("navigation", "Standard radio call format?", "Who you're calling, who you are, where you are, what you want. 'Concord Tower, Skyhawk 12345, ten miles south, inbound with Bravo, full stop.'");
c("navigation", "How do you say the numbers 3, 5, 9 and the decimal in a frequency?", "Tree, fife, niner. 'One two one point fife' for 121.5. Altitude: 'three thousand five hundred'. Headings: three digits, 'zero niner zero'.");
c("navigation", "What is the emergency frequency and the FSS frequency?", "121.5 MHz emergency (guard). Flight Service: 122.2 nationwide, plus discrete frequencies on the chart. Universal CTAF/Unicom often 122.8 or 122.9 (check the Chart Supplement).");
c("navigation", "What does ADS-B Out and In give you?", "Out: broadcasts your position to ATC and other aircraft (required where transponders are). In: lets you receive traffic (TIS-B) and weather (FIS-B) in the cockpit. FIS-B weather can be 15+ minutes old.");
c("navigation", "What is RAIM?", "Receiver Autonomous Integrity Monitoring: the GPS checking its own satellites. If RAIM fails, don't trust the GPS position; fall back to pilotage and VOR.");
c("navigation", "Where do you find an airport's frequencies, runway lengths, pattern altitude, and fuel?", "The Chart Supplement (formerly A/FD), and the sectional's airport data block for the basics.");
c("navigation", "What does 'squawk ident' mean?", "Press the IDENT button on the transponder once so your target blooms on the controller's scope. Don't change the code.");
c("navigation", "What is a magnetic course vs a magnetic heading?", "Course is the intended path over the ground; heading is where the nose points, which includes the wind correction angle.");
c("navigation", "You're on flight following and ATC says 'radar services terminated, squawk VFR'. What do you do?", "Set 1200, say 'squawk VFR, 12345', and remember you're on your own for traffic; switch to CTAF or tower as needed.");
c("navigation", "Sectional symbol: a circle with a dot and a small flag, labeled with a name?", "A VFR checkpoint (waypoint) that ATC recognizes, like a lake or a stadium. Use them in your position reports.");
c("navigation", "How much time is a Chart Supplement valid, and NOTAMs: where?", "Chart Supplement: 56 days. NOTAMs: FAA NOTAM search (notams.aim.faa.gov), the briefing, or an EFB. Check D (distant), FDC, and TFRs before every flight.");

export const CONCEPTS: ConceptCard[] = cards;
export const conceptById = (id: string) => CONCEPTS.find((c) => c.id === id);
