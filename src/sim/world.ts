/**
 * Flat-earth runway geometry for the pattern tasks. Pure: no storage, no DOM.
 * World axes match SimState: x east, y north, metres. Magnetic is treated as true.
 */
import { DEG_TO_RAD, FT_TO_M, wrapRad } from "@/lib/units";
import { airportById, type Airport } from "@/data/airports";

export interface RunwayFrame {
  thrX: number;      // landing threshold, m east
  thrY: number;      // landing threshold, m north
  hdgRad: number;    // landing direction
  lengthM: number;
  widthM: number;
  elevM: number;     // field elevation, m MSL
  patternSide: "left" | "right";
  patternAltM: number; // m MSL
}

/** Used only when the airport or runway is not in the data file. */
export const FALLBACK_RUNWAY = { lengthFt: 5000, widthFt: 75, elevationFt: 0, patternAglFt: 1000 } as const;

const headingGap = (aDeg: number, bDeg: number) => Math.abs((((aDeg - bDeg) % 360) + 540) % 360 - 180);

/**
 * Build the frame for a runway. With no runwayId the runway closest to
 * fallbackHeadingDeg (settings.runwayHeading) is used. An unknown airport or
 * runway gives a generic runway on that heading.
 */
export function runwayFrom(airport: Airport | string | undefined, runwayId?: string, fallbackHeadingDeg = 360): RunwayFrame {
  const apt = typeof airport === "string" ? airportById(airport) : airport;
  let rwy = apt?.runways.find((r) => r.id === runwayId);
  if (!rwy && !runwayId && apt?.runways.length) {
    rwy = [...apt.runways].sort((a, b) => headingGap(a.magHeading, fallbackHeadingDeg) - headingGap(b.magHeading, fallbackHeadingDeg))[0];
  }
  const elevFt = apt?.elevationFt ?? FALLBACK_RUNWAY.elevationFt;
  return {
    thrX: 0,
    thrY: 0,
    hdgRad: wrapRad((rwy?.magHeading ?? fallbackHeadingDeg) * DEG_TO_RAD),
    lengthM: (rwy?.lengthFt ?? FALLBACK_RUNWAY.lengthFt) * FT_TO_M,
    widthM: (rwy?.widthFt ?? FALLBACK_RUNWAY.widthFt) * FT_TO_M,
    elevM: elevFt * FT_TO_M,
    patternSide: rwy?.pattern ?? "left",
    patternAltM: (apt ? apt.patternAltitudeMsl : elevFt + FALLBACK_RUNWAY.patternAglFt) * FT_TO_M,
  };
}

const sideSign = (f: RunwayFrame) => (f.patternSide === "left" ? -1 : 1);

/**
 * World position to runway coordinates.
 * along: metres past the landing threshold in the landing direction.
 * cross: metres off the centreline, positive on the pattern side.
 */
export function toFrame(f: RunwayFrame, x: number, y: number): { along: number; cross: number } {
  const dx = x - f.thrX, dy = y - f.thrY;
  const sin = Math.sin(f.hdgRad), cos = Math.cos(f.hdgRad);
  const along = dx * sin + dy * cos;
  const right = dx * cos - dy * sin;
  return { along, cross: right * sideSign(f) };
}

/** Inverse of toFrame. */
export function fromFrame(f: RunwayFrame, along: number, cross: number): { x: number; y: number } {
  const sin = Math.sin(f.hdgRad), cos = Math.cos(f.hdgRad);
  const right = cross * sideSign(f);
  return { x: f.thrX + along * sin + right * cos, y: f.thrY + along * cos - right * sin };
}

/** Heading relative to the runway in degrees (-180, 180], positive when turned toward the pattern side. */
export function relHeadingDeg(f: RunwayFrame, hdgRad: number): number {
  let d = ((hdgRad - f.hdgRad) / DEG_TO_RAD) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  const s = d * sideSign(f);
  return s === -180 ? 180 : s;
}

/** True when the point is on the paved runway. */
export function onRunway(f: RunwayFrame, x: number, y: number): boolean {
  const p = toFrame(f, x, y);
  return p.along >= 0 && p.along <= f.lengthM && Math.abs(p.cross) <= f.widthM / 2;
}
