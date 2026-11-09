/**
 * Charlotte-area airports used by the radio scenarios and weather card.
 * Frequencies from the FAA Chart Supplement via AirNav, checked Sept 2026.
 * ALWAYS verify against the current Chart Supplement before using them for real.
 */
export interface Airport {
  id: string;            // ICAO
  name: string;
  spoken: string;        // how ATC says it
  elevationFt: number;
  towered: boolean;
  towerHours?: string;
  airspace: string;
  runways: { id: string; lengthFt: number; widthFt: number; magHeading: number; pattern: "left" | "right" }[];
  patternAltitudeMsl: number;
  freqs: { ctaf?: number; unicom?: number; atis?: number; awos?: number; ground?: number; tower?: number; clearance?: number; approach?: number };
  taxiways: string[];
  notes: string[];
}

export const AIRPORTS: Airport[] = [
  {
    id: "KJQF",
    name: "Concord-Padgett Regional",
    spoken: "Concord",
    elevationFt: 704,
    towered: true,
    towerHours: "0700–2300 local; Charlotte Approach handles it when the tower is closed",
    airspace: "Class D when the tower is open (surface to 2,500 ft AGL), under the Charlotte Class B shelves; Class E/G when closed",
    runways: [
      { id: "02", lengthFt: 7402, widthFt: 100, magHeading: 16, pattern: "left" },
      { id: "20", lengthFt: 7402, widthFt: 100, magHeading: 196, pattern: "left" },
    ],
    patternAltitudeMsl: 1700,
    freqs: { ctaf: 134.65, tower: 134.65, ground: 121.85, atis: 133.675, unicom: 122.95, clearance: 127.25, approach: 128.325 },
    taxiways: ["Alpha (full-length parallel)", "Bravo", "Charlie", "Delta"],
    notes: [
      "Busy with training, corporate jets and NASCAR traffic; expect 'line up and wait' and sequencing.",
      "Under the Charlotte Bravo: check the TAC for the shelf floor over the practice area before climbing.",
      "Pattern altitude 1,700 ft MSL (about 1,000 ft AGL). Left traffic both runways.",
    ],
  },
  {
    id: "KEQY",
    name: "Charlotte-Monroe Executive",
    spoken: "Monroe",
    elevationFt: 683,
    towered: false,
    airspace: "Class E surface area; non-towered, under the Charlotte Class B",
    runways: [
      { id: "05", lengthFt: 7001, widthFt: 100, magHeading: 53, pattern: "left" },
      { id: "23", lengthFt: 7001, widthFt: 100, magHeading: 233, pattern: "left" },
    ],
    patternAltitudeMsl: 1700,
    freqs: { ctaf: 122.7, unicom: 122.7, awos: 135.775, clearance: 132.55, approach: 120.05 },
    taxiways: ["Alpha (parallel)"],
    notes: [
      "Non-towered: self-announce on 122.7. Deer and birds on and around the airport.",
      "Steep shoulder drop-off between runway 23 and taxiway Alpha on the right side.",
      "Pattern altitude about 1,700 ft MSL. Left traffic both runways.",
    ],
  },
  {
    id: "KCLT",
    name: "Charlotte Douglas International",
    spoken: "Charlotte",
    elevationFt: 748,
    towered: true,
    airspace: "Class B primary airport. Bravo goes up to 10,000 ft MSL with shelves; Mode C veil 30 nm",
    runways: [
      { id: "18C/36C", lengthFt: 10000, widthFt: 150, magHeading: 183, pattern: "left" },
      { id: "18L/36R", lengthFt: 8676, widthFt: 150, magHeading: 183, pattern: "left" },
      { id: "18R/36L", lengthFt: 9000, widthFt: 150, magHeading: 183, pattern: "left" },
      { id: "05/23", lengthFt: 7502, widthFt: 150, magHeading: 53, pattern: "left" },
    ],
    patternAltitudeMsl: 1750,
    freqs: { approach: 120.05 },
    taxiways: [],
    notes: [
      "Student training does not go into CLT. The relevance is the Bravo: you need the words 'cleared into the Class Bravo airspace'.",
      "Charlotte Approach sectors: 120.05 (south/east, Monroe side) and 128.325 (north, Concord side) are the ones you'll hear most.",
    ],
  },
];

export const airportById = (id: string) => AIRPORTS.find((a) => a.id === id);

export const CHARLOTTE_BRAVO_NOTES = [
  "Charlotte Class B: surface area around CLT and stacked shelves out to about 30 nm, ceiling 10,000 ft MSL. Shelf floors are on the Charlotte TAC; KJQF and KEQY sit under shelves.",
  "Entry needs the explicit clearance 'cleared into the Class Bravo airspace'. A squawk and 'radar contact' are not a clearance.",
  "Mode C veil: transponder with altitude and ADS-B Out required within 30 nm of CLT from the surface to 10,000 ft.",
  "Speed limit under the shelves and in VFR corridors: 200 knots.",
];
