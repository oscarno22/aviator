/**
 * Cessna 172S (180 hp, fuel injected) reference numbers used across the app.
 * Speeds are KIAS unless noted. Verify against the POH for the specific
 * airplane and weight your school uses; these are training-typical values.
 */
export const C172 = {
  model: "Cessna 172S Skyhawk",
  engine: "Lycoming IO-360-L2A, 180 hp @ 2700 rpm",
  maxGrossLb: 2550,
  typicalTrainingWeightLb: 2400,
  usableFuelGal: 53,
  fuelBurnGph: 8.5,
  vSpeeds: {
    Vr: { kt: 55, label: "Rotation" },
    Vx: { kt: 62, label: "Best angle of climb (sea level)" },
    Vy: { kt: 74, label: "Best rate of climb (sea level)" },
    Vglide: { kt: 68, label: "Best glide (max gross)" },
    Va: { kt: 105, label: "Maneuvering (2550 lb); 98 @ 2200 lb; 90 @ 1900 lb" },
    Vfe10: { kt: 110, label: "Max flap extended, 10°" },
    Vfe30: { kt: 85, label: "Max flap extended, 10°–30°" },
    Vno: { kt: 129, label: "Max structural cruising" },
    Vne: { kt: 163, label: "Never exceed" },
    Vs1: { kt: 48, label: "Stall, flaps up (KCAS)" },
    Vs0: { kt: 40, label: "Stall, flaps 30° (KCAS)" },
    enrouteClimb: { kt: 80, label: "Enroute climb 75–85" },
    normalApproach: { kt: 65, label: "Normal approach, flaps 30° (60–70)" },
    shortFieldApproach: { kt: 61, label: "Short-field approach, flaps 30°" },
    shortFieldClimb: { kt: 56, label: "Short-field obstacle climb, flaps 10°" },
    emergencyNoPowerFlapsUp: { kt: 70, label: "Emergency landing, flaps up" },
    emergencyNoPowerFlapsDown: { kt: 65, label: "Emergency landing, flaps down" },
  },
  limits: {
    maxDemonstratedCrosswindKt: 15,
    magnetoDropMaxRpm: 150,
    magnetoDifferentialMaxRpm: 50,
    runupRpm: 1800,
    oilPressureMinPsi: 20,
    oilPressureMaxPsi: 115,
    oilTempMaxF: 245,
  },
  performance: {
    seaLevelClimbFpm: 730,
    cruise75PctKtas: 122,
    serviceCeilingFt: 14000,
    takeoffGroundRollFt: 960,
    takeoffOver50FtFt: 1630,
    landingGroundRollFt: 575,
    landingOver50FtFt: 1335,
  },
} as const;

/** Airspeed indicator arcs for the six-pack rendering. */
export const AIRSPEED_ARCS = {
  white: { from: 40, to: 85 },
  green: { from: 48, to: 129 },
  yellow: { from: 129, to: 163 },
  redline: 163,
  max: 200,
} as const;
