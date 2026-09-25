/**
 * Private Pilot Airplane ACS (FAA-S-ACS-6C) maneuvers, written for a Cessna 172S.
 * Tolerances are the ACS standards; procedures are typical school technique.
 * Verify against the current ACS and your instructor's preferred flow.
 */
export type ManeuverArea =
  | "Takeoffs & Landings"
  | "Performance Maneuvers"
  | "Ground Reference"
  | "Slow Flight & Stalls"
  | "Emergency Operations"
  | "Basic Instrument"
  | "Navigation & Airport Ops";

export interface ManeuverStep {
  action: string;
  callout?: string;      // what he says out loud
  target?: string;       // the number to hit
  durationSec?: number;  // chair-fly auto-advance
}

export interface Maneuver {
  id: string;
  name: string;
  area: ManeuverArea;
  acsRef: string;
  objective: string;
  entry: { altitude?: string; airspeed?: string; config?: string; power?: string; other?: string };
  steps: ManeuverStep[];
  tolerances: string[];
  commonErrors: string[];
  simTaskId?: string;
  checklistIds?: string[];
  notes?: string;
}

const CLEARING = { action: "Clearing turns, 90° left and right. Look outside.", callout: "Clear left, clear right", durationSec: 8 };

export const MANEUVERS: Maneuver[] = [
  // ------------------------- Takeoffs & Landings -------------------------
  {
    id: "normal-takeoff",
    name: "Normal Takeoff and Climb",
    area: "Takeoffs & Landings",
    acsRef: "PA.IV.A",
    objective: "Take off and climb safely while holding centerline and Vy.",
    entry: { config: "Flaps 0–10°, trim set for takeoff", power: "Full", other: "Runway centerline, heels on the floor" },
    steps: [
      { action: "Line up on centerline, nose wheel straight. Check heading indicator matches runway.", callout: "Runway two zero, heading two zero zero", durationSec: 6 },
      { action: "Smoothly apply full throttle. Right rudder as power comes in.", callout: "Full power", durationSec: 4 },
      { action: "Check engine instruments and airspeed.", callout: "Power good, gauges green, airspeed alive", durationSec: 4 },
      { action: "At 55 knots, rotate smoothly to the climb attitude.", callout: "Fifty-five, rotate", target: "Vr 55 KIAS", durationSec: 4 },
      { action: "Pitch for Vy 74. Hold right rudder. Look outside; check the ball.", callout: "Seventy-four, positive rate", target: "Vy 74 KIAS (+10/−5)", durationSec: 8 },
      { action: "Flaps up once clear of obstacles and above 60 knots. Trim.", callout: "Flaps up, trim", durationSec: 6 },
      { action: "Above 1000 ft AGL: enroute climb 75–85, mixture as required, after-takeoff flow.", callout: "Enroute climb, flow", durationSec: 6 },
    ],
    tolerances: ["Vy +10/−5 kt", "Heading/centerline: maintain runway alignment", "Flaps retracted after clear of obstacles"],
    commonErrors: ["Not enough right rudder: heading drifts left", "Rotating early or pulling hard: mushing in ground effect", "Chasing airspeed instead of holding the pitch attitude", "Forgetting to check engine instruments on the roll"],
    checklistIds: ["before-takeoff", "normal-takeoff"],
  },
  {
    id: "normal-landing",
    name: "Normal Approach and Landing",
    area: "Takeoffs & Landings",
    acsRef: "PA.IV.B",
    objective: "Fly a stabilized approach and touch down on the mains at a chosen point.",
    entry: { altitude: "Pattern altitude (1000 ft AGL)", airspeed: "Downwind 90, base 70–80, final 65", config: "Flaps 10 abeam, 20 base, 30 final", power: "Abeam: ~1500 rpm" },
    steps: [
      { action: "Abeam the numbers: power 1500, flaps 10, pitch for 80, trim.", callout: "Abeam, power back, flaps ten, eighty knots", durationSec: 8 },
      { action: "Turn base when the touchdown point is 45° behind the wing. Flaps 20, slow to 70.", callout: "Base, flaps twenty, seventy", durationSec: 8 },
      { action: "Turn final aligned with centerline. Flaps 30, 65 knots. Trim. Adjust power for the aimpoint.", callout: "Final, flaps thirty, sixty-five, stabilized", target: "65 KIAS (+10/−5)", durationSec: 10 },
      { action: "Aimpoint fixed in the windshield. Pitch for airspeed, power for glidepath.", callout: "Aimpoint steady", durationSec: 8 },
      { action: "Over the threshold: power to idle, eyes to the far end of the runway, begin the roundout.", callout: "Idle, roundout", durationSec: 5 },
      { action: "Hold it off. Keep raising the nose as it sinks. Touch down mains first, nose high, aligned.", callout: "Hold it off... hold it off", durationSec: 6 },
      { action: "Lower the nose gently, centerline with rudder, brakes as needed, flaps up when clear.", callout: "Centerline, brakes, flaps up", durationSec: 6 },
    ],
    tolerances: ["Final approach 1.3 Vso or POH speed +10/−5 kt (gust factor applied)", "Touchdown within 400 ft beyond the specified point", "No side drift; longitudinal axis aligned with centerline", "Proper pitch attitude on touchdown"],
    commonErrors: ["Unstable approach not corrected (go around!)", "Looking at the aimpoint during the flare instead of the far end", "Flaring too high or too fast: ballooning, floating", "Relaxing crosswind correction after touchdown"],
    checklistIds: ["descent-before-landing", "after-landing"],
  },
  {
    id: "short-field-takeoff",
    name: "Short-Field Takeoff and Maximum Performance Climb",
    area: "Takeoffs & Landings",
    acsRef: "PA.IV.E",
    objective: "Use all available runway and climb at Vx to clear a 50-ft obstacle.",
    entry: { config: "Flaps 10°", power: "Full, brakes held", other: "Back-taxi to use the whole runway" },
    steps: [
      { action: "Position at the very end of the runway. Hold brakes.", callout: "Full length", durationSec: 5 },
      { action: "Full throttle, check RPM and gauges, release brakes.", callout: "Full power, gauges green, brakes released", durationSec: 5 },
      { action: "Slight back pressure; rotate at 51 knots.", callout: "Fifty-one, rotate", target: "Rotate 51 KIAS", durationSec: 4 },
      { action: "Climb at 56 knots until the obstacle is cleared. Do not chase the horizon; hold the pitch.", callout: "Fifty-six, obstacle climb", target: "56 KIAS (Vx flaps 10) +10/−5", durationSec: 8 },
      { action: "Obstacle clear: accelerate to Vy 74, flaps up above 60, trim.", callout: "Clear, seventy-four, flaps up", target: "Vy 74 +10/−5", durationSec: 6 },
    ],
    tolerances: ["Vx +10/−5 kt until obstacle cleared / 50 ft AGL", "Vy +10/−5 kt after", "Maintain runway alignment", "Use all available runway"],
    commonErrors: ["Rotating too early and mushing", "Letting the nose drop before the obstacle", "Retracting flaps too low", "Forgetting to hold brakes during power-up"],
    checklistIds: ["before-takeoff"],
  },
  {
    id: "short-field-landing",
    name: "Short-Field Approach and Landing",
    area: "Takeoffs & Landings",
    acsRef: "PA.IV.F",
    objective: "Steep, stabilized approach at 61 knots and touch down within 200 ft of the point with minimum float.",
    entry: { airspeed: "Final 61 KIAS", config: "Flaps 30°", power: "As required, slightly steeper than normal" },
    steps: [
      { action: "Pattern as normal. Flaps 30 on final, slow to 61 knots. Trim.", callout: "Final, flaps thirty, sixty-one", target: "61 KIAS (+10/−5)", durationSec: 8 },
      { action: "Pick the touchdown point. Power controls the descent; pitch holds 61.", callout: "Point, sixty-one, steady", durationSec: 8 },
      { action: "Over the obstacle: reduce power, hold attitude. Minimal float.", callout: "Idle, roundout", durationSec: 5 },
      { action: "Touch down on the point, mains first. Immediately: flaps up, maximum braking, back pressure.", callout: "Down. Flaps up, brakes, back pressure", durationSec: 6 },
    ],
    tolerances: ["Approach 1.3 Vso or POH speed +10/−5 kt", "Touchdown within 200 ft beyond the specified point", "No side drift, centerline aligned", "Minimum float; brakes and flaps per POH"],
    commonErrors: ["Carrying extra speed: floating past the point", "Dragging it in low with power", "Landing short by cutting power too early", "Retracting flaps before the airplane is actually on the ground"],
  },
  {
    id: "soft-field-takeoff",
    name: "Soft-Field Takeoff and Climb",
    area: "Takeoffs & Landings",
    acsRef: "PA.IV.C",
    objective: "Keep the nose wheel light, lift off early, accelerate in ground effect.",
    entry: { config: "Flaps 10°", power: "Full", other: "Do not stop on the soft surface; keep rolling" },
    steps: [
      { action: "Full back pressure during taxi onto the runway; keep rolling, no brakes.", callout: "Yoke back, keep it rolling", durationSec: 6 },
      { action: "Full throttle smoothly. Nose wheel lifts; relax slightly to hold a nose-high attitude.", callout: "Full power, nose light", durationSec: 5 },
      { action: "Lift off at the lowest possible airspeed. Lower the nose to stay in ground effect.", callout: "Off... stay in ground effect", durationSec: 5 },
      { action: "Accelerate in ground effect to Vx 62 (obstacle) or Vy 74, then climb.", callout: "Seventy-four, climb", target: "Vx/Vy +10/−5", durationSec: 8 },
      { action: "Flaps up above 60 and clear of obstacles. Trim.", callout: "Flaps up, trim", durationSec: 5 },
    ],
    tolerances: ["Lift off at lowest possible airspeed", "Remain in ground effect until Vx/Vy", "Vx/Vy +10/−5 kt", "Runway alignment maintained"],
    commonErrors: ["Too much back pressure: dragging the tail or a premature stall", "Climbing out of ground effect too soon and settling", "Stopping on the runway"],
  },
  {
    id: "soft-field-landing",
    name: "Soft-Field Approach and Landing",
    area: "Takeoffs & Landings",
    acsRef: "PA.IV.D",
    objective: "Touch down as softly and slowly as possible, keep the nose wheel off.",
    entry: { airspeed: "Final 60–65 KIAS", config: "Flaps 30°", power: "Small amount of power through the flare" },
    steps: [
      { action: "Normal stabilized approach, flaps 30, 60–65 knots.", callout: "Final, flaps thirty, sixty-five", durationSec: 8 },
      { action: "Keep a touch of power in the roundout to cushion the touchdown.", callout: "Little power, hold it off", durationSec: 6 },
      { action: "Touch down at minimum speed, nose high, mains first.", callout: "Soft... soft", durationSec: 5 },
      { action: "Hold the nose wheel off with back pressure as long as possible. No brakes. Keep rolling.", callout: "Nose up, keep rolling", durationSec: 6 },
    ],
    tolerances: ["Approach 1.3 Vso or POH speed +10/−5 kt", "Touchdown with minimum sink rate and no side drift", "Nose wheel held off; minimal braking"],
    commonErrors: ["Flaring high with power and floating", "Letting the nose wheel slam down", "Using brakes on the soft surface"],
  },
  {
    id: "go-around",
    name: "Go-Around / Rejected Landing",
    area: "Takeoffs & Landings",
    acsRef: "PA.IV.N",
    objective: "Immediately transition from approach to climb: power, pitch, flaps.",
    entry: { airspeed: "On final, 65 KIAS", config: "Flaps 30°", other: "Decision: unstable, runway occupied, or told to go around" },
    steps: [
      { action: "Full throttle immediately. Right rudder.", callout: "Go around, full power", durationSec: 3 },
      { action: "Pitch to the climb attitude, arrest the descent. Expect a strong nose-up trim force: push.", callout: "Pitch up, push", durationSec: 4 },
      { action: "Flaps to 20 right away. Positive rate, then flaps 10.", callout: "Flaps twenty... positive rate, flaps ten", durationSec: 6 },
      { action: "Accelerate to Vy 74. Flaps up above 60 and clear of obstacles. Trim.", callout: "Seventy-four, flaps up, trim", target: "Vy 74 +10/−5", durationSec: 6 },
      { action: "Offset to the right of the runway to watch traffic, announce on the radio, re-enter the pattern.", callout: "Skyhawk going around, runway two zero", durationSec: 6 },
    ],
    tolerances: ["Full power applied immediately", "Vx or Vy +10/−5 kt", "Heading ±10° / sidestep as appropriate", "Flaps retracted per POH after climb established"],
    commonErrors: ["Hesitating on the decision", "Retracting all flaps at once (sink!)", "Not pushing against the trim: pitch balloons toward a stall", "Forgetting the radio call"],
  },
  {
    id: "forward-slip",
    name: "Forward Slip to a Landing",
    area: "Takeoffs & Landings",
    acsRef: "PA.IV.M",
    objective: "Lose altitude quickly without gaining airspeed, then touch down on the point.",
    entry: { altitude: "High on final", airspeed: "65–70 KIAS", config: "Flaps as briefed (ask your CFI about slips with full flaps in a 172)", power: "Idle" },
    steps: [
      { action: "Power idle. Lower the upwind wing with aileron.", callout: "Idle, wing down", durationSec: 4 },
      { action: "Opposite rudder to hold the nose on the runway centerline track.", callout: "Opposite rudder, track centerline", durationSec: 5 },
      { action: "Airspeed indication may be unreliable in a slip; fly the pitch attitude.", callout: "Attitude, not the ASI", durationSec: 5 },
      { action: "Approaching the roundout: neutralize rudder and aileron together, resume a normal flare.", callout: "Straighten out, flare", durationSec: 5 },
    ],
    tolerances: ["Maintain airspeed appropriate for the slip", "Touchdown within 400 ft beyond the specified point", "Aligned with centerline at touchdown"],
    commonErrors: ["Letting the nose drop and gaining airspeed", "Recovering from the slip too late or too abruptly", "Skidding instead of slipping"],
  },
  {
    id: "traffic-pattern",
    name: "Traffic Pattern",
    area: "Navigation & Airport Ops",
    acsRef: "PA.III.B",
    objective: "Fly a standard pattern with correct entry, spacing, altitudes, speeds and radio calls.",
    entry: { altitude: "1000 ft AGL", airspeed: "Downwind 90 KIAS", power: "~2200 rpm" },
    steps: [
      { action: "Enter 45° to downwind at pattern altitude (or as instructed by tower).", callout: "Entering left downwind, runway two zero", durationSec: 8 },
      { action: "Downwind: pattern altitude, 90 knots, parallel to the runway at ½ to 1 mile. Pre-landing flow.", callout: "Downwind, flow complete", durationSec: 8 },
      { action: "Abeam the numbers: power 1500, flaps 10, 80 knots, begin descent.", callout: "Abeam, power back, flaps ten", durationSec: 6 },
      { action: "Base: flaps 20, 70 knots, check for traffic on final.", callout: "Left base, runway two zero", durationSec: 6 },
      { action: "Final: flaps 30, 65 knots, stabilized by 300 ft AGL.", callout: "Final, runway two zero, stabilized", durationSec: 8 },
    ],
    tolerances: ["Altitude ±100 ft", "Airspeed ±10 kt", "Proper spacing, corrected for wind", "Correct entry and departure; radio calls at each leg"],
    commonErrors: ["Drifting in or out on downwind with wind", "Turning base too early or late", "Descending on downwind before abeam", "Radio call without a position"],
  },

  // ------------------------- Performance -------------------------
  {
    id: "steep-turns",
    name: "Steep Turns",
    area: "Performance Maneuvers",
    acsRef: "PA.V.A",
    objective: "360° turn at 45° bank holding altitude and airspeed, rolling out on the entry heading.",
    entry: { altitude: "≥ 1500 ft AGL, ~3000 ft MSL", airspeed: "95–100 KIAS (below Va)", power: "~2300 rpm", config: "Flaps up, trimmed" },
    steps: [
      CLEARING,
      { action: "Note the entry heading and altitude. Pick a reference on the horizon.", callout: "Heading two seven zero, altitude three thousand", durationSec: 5 },
      { action: "Roll smoothly into a 45° bank. Passing 30°, add ~100 rpm and back pressure.", callout: "Rolling in, power up, back pressure", target: "45° bank ±5°", durationSec: 6 },
      { action: "Hold the sight picture: nose on the horizon reference. Scan bank, altitude, airspeed. Small corrections.", callout: "Bank, altitude, airspeed", durationSec: 10 },
      { action: "Altitude dropping? Reduce bank a little, then pitch. Climbing? Steepen slightly.", callout: "Correct with bank first", durationSec: 8 },
      { action: "Lead the rollout by about 20–25° (half the bank angle). Roll out, release back pressure, power back.", callout: "Two four five, rolling out", target: "Rollout ±10° of entry heading", durationSec: 6 },
      { action: "Immediately roll into the opposite direction if required. Same procedure.", callout: "Reversing", durationSec: 6 },
    ],
    tolerances: ["Bank 45° ±5°", "Altitude ±100 ft", "Airspeed ±10 kt", "Rollout on entry heading ±10°", "Entry at or below Va"],
    commonErrors: ["Losing altitude from insufficient back pressure at 45°", "Correcting altitude with pitch alone (tightens the turn)", "Fixating on instruments; not looking outside", "Late rollout"],
    simTaskId: "steep-turn",
  },

  // ------------------------- Ground reference -------------------------
  {
    id: "rectangular-course",
    name: "Rectangular Course",
    area: "Ground Reference",
    acsRef: "PA.VI.A",
    objective: "Fly a rectangle around a field, correcting for wind, as practice for the traffic pattern.",
    entry: { altitude: "600–1000 ft AGL", airspeed: "90 KIAS", power: "~2100 rpm", other: "Enter on a 45° to the downwind leg" },
    steps: [
      CLEARING,
      { action: "Pick a rectangular field. Enter at 45° to the downwind (tailwind) leg, ½ to ¾ mile out.", callout: "Entering downwind", durationSec: 8 },
      { action: "Downwind: groundspeed is highest. The first turn is the steepest.", callout: "Steep turn to base", durationSec: 8 },
      { action: "Base: crab into the wind to hold the track parallel to the field.", callout: "Crab into the wind", durationSec: 8 },
      { action: "Upwind: groundspeed lowest; the turn to crosswind is shallow.", callout: "Shallow turn", durationSec: 8 },
      { action: "Crosswind: crab into the wind again. Turn to downwind is medium-to-steep as speed increases.", callout: "Crab, then steepen", durationSec: 8 },
    ],
    tolerances: ["Altitude ±100 ft", "Airspeed ±10 kt", "Constant distance from the field", "Bank not to exceed 45°", "Divide attention; look for traffic"],
    commonErrors: ["Not anticipating the wind on each turn", "Fixating on the ground and losing altitude", "Uncoordinated turns while looking down"],
  },
  {
    id: "s-turns",
    name: "S-Turns Across a Road",
    area: "Ground Reference",
    acsRef: "PA.VI.B",
    objective: "Two equal half-circles on either side of a road, wings level crossing the road each time.",
    entry: { altitude: "600–1000 ft AGL", airspeed: "90 KIAS", other: "Enter downwind, perpendicular to the road" },
    steps: [
      CLEARING,
      { action: "Cross the road downwind, wings level. Begin the first turn immediately with the steepest bank.", callout: "Crossing, steep bank", durationSec: 8 },
      { action: "Shallow the bank progressively as you turn into the wind.", callout: "Shallowing", durationSec: 8 },
      { action: "Cross the road again wings level, perpendicular. Reverse the turn.", callout: "Wings level, reverse", durationSec: 6 },
      { action: "Second half: start shallow (upwind), steepen as the tailwind builds.", callout: "Shallow to steep", durationSec: 8 },
    ],
    tolerances: ["Altitude ±100 ft", "Airspeed ±10 kt", "Wings level and perpendicular at each road crossing", "Equal radius on both sides"],
    commonErrors: ["Crossing the road in a bank", "Lopsided halves from poor wind correction", "Altitude loss while looking at the road"],
  },
  {
    id: "turns-around-a-point",
    name: "Turns Around a Point",
    area: "Ground Reference",
    acsRef: "PA.VI.C",
    objective: "Constant-radius circle around a point, varying bank with groundspeed.",
    entry: { altitude: "600–1000 ft AGL", airspeed: "90 KIAS", other: "Enter downwind abeam the point" },
    steps: [
      CLEARING,
      { action: "Enter downwind abeam the point at the chosen radius. Roll into the steepest bank now.", callout: "Abeam, steep bank", durationSec: 8 },
      { action: "As you turn upwind, shallow the bank to hold the radius.", callout: "Shallowing into the wind", durationSec: 8 },
      { action: "Upwind abeam: shallowest bank. Crab angle away from the point.", callout: "Shallowest", durationSec: 6 },
      { action: "Turning back downwind: steepen again. Two full circles, then roll out on entry heading.", callout: "Steepening, rolling out on heading", durationSec: 8 },
    ],
    tolerances: ["Altitude ±100 ft", "Airspeed ±10 kt", "Constant radius", "Bank not to exceed 45°"],
    commonErrors: ["Steepest bank in the wrong place", "Chasing the radius with big bank changes", "Getting blown downwind of the point"],
  },

  // ------------------------- Slow flight & stalls -------------------------
  {
    id: "slow-flight",
    name: "Maneuvering During Slow Flight",
    area: "Slow Flight & Stalls",
    acsRef: "PA.VII.A",
    objective: "Fly just above the stall warning with full flaps: turns, climbs, descents, all coordinated.",
    entry: { altitude: "≥ 1500 ft AGL, ~3000 ft MSL", airspeed: "Target 50–55 KIAS (no stall horn)", config: "Flaps 30°", power: "~1800–2100 rpm to hold altitude" },
    steps: [
      CLEARING,
      { action: "Power to ~1500 rpm. Hold altitude with pitch as the airplane slows.", callout: "Power fifteen hundred, hold altitude", durationSec: 8 },
      { action: "Flaps 10 below 110, flaps 20 below 85, flaps 30 below 85. Trim as you go.", callout: "Flaps ten... twenty... thirty, trim", durationSec: 10 },
      { action: "Approaching 60 knots: add power to ~2000 rpm to stop the descent. Lots of right rudder.", callout: "Power up, right rudder", durationSec: 8 },
      { action: "Stabilize at the target speed: nose high, ball centered, altitude steady. Any slower and the horn comes on.", callout: "Fifty-five knots, established", target: "Target speed +10/−0", durationSec: 10 },
      { action: "Turns with 10–20° bank. Add a little power in the turn. Climb with power, descend with power.", callout: "Turning left, heading one eight zero", durationSec: 10 },
      { action: "Recovery: full power, flaps to 20, positive rate, flaps 10, accelerate, flaps up above 70. Trim.", callout: "Recovering, full power, flaps twenty", durationSec: 8 },
    ],
    tolerances: ["Altitude ±100 ft", "Heading ±10°", "Airspeed +10/−0 kt of the specified speed", "Bank ±10° of specified", "No stall warning during the maneuver"],
    commonErrors: ["Letting the horn sound (too slow)", "Insufficient right rudder: ball out, heading drifting", "Big power changes; chasing altitude", "Retracting all flaps at once on recovery"],
    simTaskId: "slow-flight",
  },
  {
    id: "power-off-stall",
    name: "Power-Off Stall",
    area: "Slow Flight & Stalls",
    acsRef: "PA.VII.B",
    objective: "Simulate an approach-to-landing stall, fully stall, and recover with minimum altitude loss.",
    entry: { altitude: "≥ 1500 ft AGL, ~3000 ft MSL", airspeed: "Stabilized descent at 65 KIAS", config: "Flaps 30° (landing configuration)", power: "Idle" },
    steps: [
      CLEARING,
      { action: "Power 1500, hold altitude, flaps 10/20/30 as speed allows. Trim for a 65-knot approach descent.", callout: "Landing configuration, sixty-five knot descent", durationSec: 10 },
      { action: "Power to idle. Smoothly raise the nose to the landing attitude and keep raising it. Hold heading with rudder.", callout: "Idle, pitching up, heading two seven zero", target: "Heading ±10°", durationSec: 8 },
      { action: "Horn, buffet, then the break: the nose drops. This is the full stall.", callout: "Horn... buffet... stall", durationSec: 5 },
      { action: "Recover: reduce angle of attack (pitch to just below the horizon), FULL power, right rudder, level the wings with rudder then aileron.", callout: "Nose down, full power, wings level", durationSec: 5 },
      { action: "Flaps to 20 immediately. Positive rate: flaps 10. Accelerate to Vy, flaps up above 70. Climb to entry altitude.", callout: "Flaps twenty, positive rate, flaps ten, seventy-four", durationSec: 8 },
    ],
    tolerances: ["Heading ±10° (straight) or bank ≤ 20° ±10° (turning)", "Acknowledge cues then recover promptly after a full stall", "Minimum altitude loss", "No secondary stall", "Coordinated throughout"],
    commonErrors: ["Recovering before the full stall (or not recognizing it)", "Pushing the nose too far down: excessive altitude loss", "Not adding full power promptly", "Using aileron to pick up a wing during the stall (spin risk)", "Secondary stall from pulling too soon"],
    simTaskId: "power-off-stall",
    checklistIds: ["spin-recovery"],
  },
  {
    id: "power-on-stall",
    name: "Power-On Stall",
    area: "Slow Flight & Stalls",
    acsRef: "PA.VII.C",
    objective: "Simulate a departure stall at high power and high pitch, and recover.",
    entry: { altitude: "≥ 1500 ft AGL, ~3000 ft MSL", airspeed: "Slow to 55 KIAS (rotation speed)", config: "Flaps 0 or 10 (takeoff configuration)", power: "Full (or ≥ 65%) as pitch increases" },
    steps: [
      CLEARING,
      { action: "Power 1500, hold altitude, slow to rotation speed 55 knots. Takeoff flaps as briefed.", callout: "Slowing to fifty-five", durationSec: 8 },
      { action: "Smoothly add full power while pitching up to a high climb attitude (15–20°). Lots of right rudder.", callout: "Full power, pitch up, right rudder", target: "Heading ±10°", durationSec: 8 },
      { action: "Hold the attitude. Horn, buffet, then the break.", callout: "Horn... buffet... stall", durationSec: 6 },
      { action: "Recover: lower the nose to the horizon (small reduction is enough), keep full power, level the wings with rudder.", callout: "Nose to the horizon, wings level", durationSec: 5 },
      { action: "Accelerate to Vy 74, flaps up if used, climb back to entry altitude.", callout: "Seventy-four, climbing", durationSec: 6 },
    ],
    tolerances: ["Heading ±10° (straight) or bank ≤ 20° ±10° (turning)", "Power ≥ 65% (full is typical)", "Recover promptly after a full stall", "Minimum altitude loss; no secondary stall"],
    commonErrors: ["Not enough right rudder: wing drops at the break (spin entry)", "Over-recovering: diving and losing altitude", "Reducing power in the recovery", "Pitching up too slowly so the airplane never stalls"],
    checklistIds: ["spin-recovery"],
  },
  {
    id: "spin-awareness",
    name: "Spin Awareness",
    area: "Slow Flight & Stalls",
    acsRef: "PA.VII.D",
    objective: "Know how spins happen, how to avoid them, and the PARE recovery (knowledge and chair-fly only).",
    entry: { other: "Not flown in training; you must be able to explain it and recite the recovery." },
    steps: [
      { action: "A spin needs two things: a stall AND yaw. No stall, no spin.", callout: "Stall plus yaw", durationSec: 6 },
      { action: "Most likely: base-to-final skidding turn, low, slow, uncoordinated. Keep the ball centered near the ground.", callout: "Ball centered, base to final", durationSec: 8 },
      { action: "Incipient spin: a wing drops at the stall. Recover immediately with rudder, not aileron.", callout: "Wing drop, opposite rudder", durationSec: 6 },
      { action: "P — Power idle. A — Ailerons neutral. R — Rudder full opposite the rotation. E — Elevator briskly forward.", callout: "Power, ailerons, rudder, elevator", durationSec: 8 },
      { action: "Rotation stops: neutralize rudder, recover from the dive smoothly. Watch airspeed and G.", callout: "Rudder neutral, ease out", durationSec: 6 },
    ],
    tolerances: ["Explain aerodynamic factors, phases, and the recovery per POH", "Recite the recovery from memory"],
    commonErrors: ["Using aileron to stop the roll (aggravates the spin)", "Holding back pressure", "Pulling out of the dive too hard: secondary stall"],
    checklistIds: ["spin-recovery"],
  },

  // ------------------------- Emergency -------------------------
  {
    id: "emergency-descent",
    name: "Emergency Descent",
    area: "Emergency Operations",
    acsRef: "PA.IX.A",
    objective: "Get down fast (fire, smoke, medical) while keeping the airplane within limits.",
    entry: { altitude: "Cruise", airspeed: "Target 120 KIAS clean (never above Vno 129 in smooth air)", config: "Flaps up", power: "Idle" },
    steps: [
      { action: "Power idle. Mixture rich. Simulate the reason (smoke, fire) and say it.", callout: "Emergency descent, power idle", durationSec: 5 },
      { action: "Roll into a 30–45° bank and lower the nose. The bank increases drag and keeps the load on the wings.", callout: "Bank forty-five, nose down", target: "Bank 30–45°", durationSec: 6 },
      { action: "Pitch for 120 knots. Do not exceed Vno. Trim.", callout: "One twenty, below Vno", target: "Airspeed ±10 kt", durationSec: 8 },
      { action: "Clear below. Consider a radio call. Maintain orientation to a landing site.", callout: "Clearing below, Mayday if needed", durationSec: 6 },
      { action: "Level off at the assigned altitude: reduce bank, ease the nose up, add power.", callout: "Leveling, power up", target: "Level-off ±100 ft", durationSec: 6 },
    ],
    tolerances: ["Airspeed ±10 kt of specified", "Bank 30–45° as appropriate", "Level off at the specified altitude ±100 ft", "Complete the appropriate checklist", "Maintain orientation and clearing"],
    commonErrors: ["Exceeding Vno / Vfe", "Forgetting to clear below", "Pulling out late or hard"],
    checklistIds: ["engine-fire-in-flight", "electrical-fire-in-flight"],
  },
  {
    id: "emergency-approach",
    name: "Emergency Approach and Landing (Simulated Engine Failure)",
    area: "Emergency Operations",
    acsRef: "PA.IX.B",
    objective: "Best glide, pick a field, attempt a restart, secure the engine, fly a pattern to the field.",
    entry: { altitude: "Cruise or as set up by the instructor", airspeed: "68 KIAS best glide", config: "Flaps up until the field is made", power: "Idle (simulated failure)" },
    steps: [
      { action: "A — Airspeed: pitch and TRIM for 68 knots best glide immediately.", callout: "Best glide, sixty-eight, trim", target: "68 KIAS ±10", durationSec: 6 },
      { action: "B — Best field: into the wind if possible, within gliding distance, long and clear. Commit.", callout: "Field selected, into the wind", durationSec: 8 },
      { action: "C — Checklist (restart flow): fuel shutoff ON, fuel selector BOTH, aux pump ON, mixture RICH, mags BOTH or START.", callout: "Fuel on, both, pump on, mixture rich, mags both", durationSec: 10 },
      { action: "D — Declare: 121.5 or current frequency, squawk 7700. Say who, where, what.", callout: "Mayday, Mayday, Mayday, Skyhawk, engine failure", durationSec: 8 },
      { action: "E — Execute: secure the engine on final: mixture cutoff, fuel shutoff OFF, mags OFF, flaps as needed, master OFF when landing assured, door unlatched.", callout: "Mixture, fuel, mags, flaps, master, door", durationSec: 10 },
      { action: "Fly a normal-looking pattern to the field: key position abeam at ~1000 AGL, base, final. Flaps only when the field is made. Slip if high.", callout: "Key position, base, final, flaps when made", durationSec: 10 },
    ],
    tolerances: ["Best glide ±10 kt", "Suitable field within gliding distance selected promptly", "Appropriate pattern and configuration", "Checklist completed (restart, then secure)", "Divide attention; keep flying the airplane"],
    commonErrors: ["Dropping the nose late: airspeed decays before best glide", "Changing fields", "Flaps too early, landing short", "Fixating on the restart flow and losing the field"],
    simTaskId: "engine-failure",
    checklistIds: ["engine-failure-in-flight", "emergency-landing-no-power"],
  },
  {
    id: "systems-malfunctions",
    name: "Systems and Equipment Malfunctions",
    area: "Emergency Operations",
    acsRef: "PA.IX.C",
    objective: "Explain and simulate the response to common malfunctions.",
    entry: { other: "Mostly an oral topic; the examiner picks at least three." },
    steps: [
      { action: "Partial or complete power loss: fly the airplane, best glide, restart flow, land.", callout: "Aviate, navigate, communicate", durationSec: 8 },
      { action: "Engine roughness: mixture, fuel selector, mags one at a time, carb heat N/A (fuel injected), land as soon as practical.", callout: "Mixture, fuel, mags, land", durationSec: 8 },
      { action: "Loss of oil pressure: expect engine failure; reduce power, land immediately at the nearest suitable field.", callout: "Land now", durationSec: 6 },
      { action: "Electrical: check alternator (ammeter discharge / low volts), cycle master ALT, reduce load, land. Battery gives ~30 min.", callout: "Alternator off, load shed, land", durationSec: 8 },
      { action: "Vacuum failure: attitude and heading indicators fail slowly; cross-check with turn coordinator, compass and GPS. Stay VFR.", callout: "Suction gauge, cross-check", durationSec: 8 },
      { action: "Pitot/static: blocked pitot = airspeed reads like an altimeter; blocked static = altimeter frozen, VSI zero, ASI errors. Pitot heat on; alternate static.", callout: "Pitot heat, alternate static", durationSec: 8 },
      { action: "Door opens in flight: fly the airplane; it's noisy, not dangerous. Land and close it.", callout: "Fly the airplane", durationSec: 5 },
      { action: "Flap failure: land with the flaps you have; faster approach, longer roll. Trim runaway/inop trim: fly with pressure, land.", callout: "Land with what you have", durationSec: 6 },
      { action: "Icing: leave it now — descend to warmer air or turn back. Carb ice N/A on the 172S; airframe ice is prohibited.", callout: "Exit icing", durationSec: 5 },
      { action: "Smoke or fire: electrical fire checklist or engine fire checklist, emergency descent, land.", callout: "Fire checklist, get down", durationSec: 5 },
    ],
    tolerances: ["Explain causes, indications, and pilot actions for each system per POH"],
    commonErrors: ["Troubleshooting instead of flying the airplane", "Resetting a popped breaker more than once", "Not knowing the 172S has no carb heat"],
    checklistIds: ["engine-failure-in-flight", "electrical-fire-in-flight", "engine-fire-in-flight"],
  },

  // ------------------------- Basic instrument -------------------------
  {
    id: "instrument-straight-level",
    name: "Straight-and-Level by Reference to Instruments",
    area: "Basic Instrument",
    acsRef: "PA.VIII.A",
    objective: "Hold altitude, heading and airspeed using only the instruments (under the hood).",
    entry: { altitude: "Assigned", airspeed: "Cruise ~100 KIAS", power: "~2300 rpm", other: "Foggles on" },
    steps: [
      { action: "Set the attitude: wings level, nose on the horizon bar. Attitude plus power equals performance.", callout: "Attitude set", durationSec: 6 },
      { action: "Scan: attitude, altimeter, attitude, heading, attitude, airspeed. Never park on one instrument.", callout: "Attitude, altimeter, attitude, heading", durationSec: 10 },
      { action: "Altitude off by 100 ft? Change pitch by half a bar width. Off by 300? Use a bar and a small power change.", callout: "Half a bar", durationSec: 8 },
      { action: "Heading drifting? Bank equal to the degrees off, max standard rate. Trim so you're not fighting it.", callout: "Bank five, trim", durationSec: 8 },
    ],
    tolerances: ["Altitude ±200 ft", "Heading ±20°", "Airspeed ±10 kt"],
    commonErrors: ["Fixating on the altimeter", "Over-controlling: large, late corrections", "Not trimming", "Chasing the VSI (it lags)"],
    simTaskId: "straight-level",
  },
  {
    id: "instrument-climbs-descents",
    name: "Constant-Airspeed Climbs and Descents by Instruments",
    area: "Basic Instrument",
    acsRef: "PA.VIII.B / PA.VIII.C",
    objective: "Climb or descend at a constant airspeed and level off at an assigned altitude.",
    entry: { altitude: "Assigned", airspeed: "Climb Vy 74–80; descent 90 at ~500 fpm", other: "Foggles on" },
    steps: [
      { action: "Climb: power full, pitch up to the climb attitude (about 8–10° nose up), airspeed settles at 75–80. Trim.", callout: "Full power, pitch up, trim", target: "Airspeed ±10 kt", durationSec: 8 },
      { action: "Hold heading with rudder. Scan attitude, airspeed, heading. VSI is a trend, not a target.", callout: "Attitude, airspeed, heading", durationSec: 8 },
      { action: "Lead the level-off by 10% of the vertical speed (~50–80 ft). Lower the nose, let it accelerate, then reduce power to cruise. Trim.", callout: "Leading the level-off", target: "Level-off ±200 ft", durationSec: 8 },
      { action: "Descent: reduce power to ~1700 rpm, hold the pitch, let the airspeed settle at 90, then adjust pitch for airspeed and power for rate.", callout: "Power back, pitch for ninety", target: "Airspeed ±10 kt", durationSec: 8 },
      { action: "Level off: lead by 10% of the VSI, add power first, then raise the nose. Trim.", callout: "Power, pitch, trim", durationSec: 6 },
    ],
    tolerances: ["Airspeed ±10 kt", "Heading ±20°", "Level-off altitude ±200 ft"],
    commonErrors: ["Chasing airspeed with pitch instead of setting an attitude", "Forgetting to lead the level-off", "Leveling with pitch before adding power in a descent"],
    simTaskId: "vy-climb",
  },
  {
    id: "instrument-turns",
    name: "Turns to Headings by Instruments",
    area: "Basic Instrument",
    acsRef: "PA.VIII.D",
    objective: "Standard-rate turns to assigned headings, holding altitude and airspeed.",
    entry: { altitude: "Assigned", airspeed: "Cruise ~100 KIAS", other: "Foggles on" },
    steps: [
      { action: "Standard rate is 3°/s: 360° in two minutes. Bank angle ≈ airspeed ÷ 10 plus 5 (about 15° at 100 knots).", callout: "Fifteen degrees, standard rate", durationSec: 8 },
      { action: "Roll in smoothly to the turn-coordinator index. A touch of back pressure holds altitude.", callout: "Rolling in, wing on the index", target: "Standard rate", durationSec: 6 },
      { action: "Scan: attitude, heading, altimeter, turn coordinator (ball!).", callout: "Ball centered", durationSec: 8 },
      { action: "Lead the rollout by half the bank angle (~7°). Roll out wings level, release back pressure.", callout: "Lead seven, rolling out", target: "Rollout ±20°", durationSec: 6 },
    ],
    tolerances: ["Altitude ±200 ft", "Standard-rate turn", "Rollout heading ±20°", "Airspeed ±10 kt"],
    commonErrors: ["Overbanking past standard rate", "Losing altitude in the turn", "Rolling out late"],
    simTaskId: "std-rate-turn",
  },
  {
    id: "unusual-attitudes",
    name: "Recovery from Unusual Flight Attitudes",
    area: "Basic Instrument",
    acsRef: "PA.VIII.E",
    objective: "Recognize nose-high and nose-low attitudes on the instruments and recover in the right order.",
    entry: { other: "Eyes closed; instructor puts the airplane in the attitude; recover on 'your airplane'." },
    steps: [
      { action: "Open your eyes. Look at the attitude indicator and cross-check the airspeed: increasing = nose low, decreasing = nose high.", callout: "Airspeed decreasing: nose high", durationSec: 6 },
      { action: "NOSE HIGH: add power, lower the nose to the horizon, then level the wings. Power, push, roll.", callout: "Power, push, roll", durationSec: 6 },
      { action: "NOSE LOW: reduce power, level the wings, then raise the nose gently. Power, roll, pull. Never pull first in a bank.", callout: "Power, roll, pull", durationSec: 6 },
      { action: "Return to straight-and-level, re-trim, resume the scan. Check for a secondary stall or overspeed.", callout: "Level, trim, scan", durationSec: 6 },
    ],
    tolerances: ["Correct recognition", "Prompt, coordinated recovery in the correct sequence", "No secondary stall, no overspeed, within limits"],
    commonErrors: ["Pulling out of a nose-low bank before leveling the wings (tightens the spiral)", "Adding power nose-low", "Over-correcting into the opposite attitude"],
    simTaskId: "unusual-attitude",
  },
];

export const MANEUVER_AREAS: ManeuverArea[] = [
  "Takeoffs & Landings",
  "Performance Maneuvers",
  "Ground Reference",
  "Slow Flight & Stalls",
  "Emergency Operations",
  "Basic Instrument",
  "Navigation & Airport Ops",
];

export const maneuverById = (id: string) => MANEUVERS.find((m) => m.id === id);
