/**
 * Cessna 172S point-mass aero and propulsion model at a training weight.
 * CLmax is calibrated from the POH stall speeds so the sim stalls on the
 * numbers he memorized (48 KCAS clean, 40 KCAS flaps 30 at max gross,
 * scaled here to the sim weight).
 */
import { DEG_TO_RAD, G, KT_TO_MS } from "@/lib/units";
import { RHO0, sigma } from "../atmosphere";

export const C172S = {
  massKg: 2400 * 0.45359237,
  wingAreaM2: 16.2,
  aspectRatio: 7.45,
  clAlpha: 5.0,             // per rad
  kInduced: 0.058,          // 1/(π e AR), e ≈ 0.75
  cd0Clean: 0.033,
  cd0PerFlapDeg: 0.002,     // +0.02 at 10°, +0.06 at 30°
  alpha0CleanDeg: -2.0,
  alpha0PerFlapDeg: -0.4,   // −14° at flaps 30: flaps lower the stall AoA a little, as in the real wing
  vs1KcasPoh: 48,           // flaps 0 at 2550 lb
  vs0KcasPoh: 40,           // flaps 30 at 2550 lb
  pohGrossLb: 2550,
  thrustStaticN: 2800,
  thrustSlope: 22,          // N per m/s
  elevatorAlphaDeg: 20,     // α authority at full deflection (enough to stall from any trim)
  trimAlphaMinDeg: -3,
  trimAlphaMaxDeg: 12,
  alphaTau: 0.35,
  rollRateMaxDeg: 45,
  rollTau: 0.2,
  rollRefSpeed: 51,         // m/s at which full roll rate is available
  rudderYawDeg: 3,          // deg/s at full rudder
  hornMarginDeg: 4,
  incidenceDeg: 1.5,
  vsiTau: 2.5,
  rpmTau: 0.5,
  ballTau: 0.4,
  flapRateDegPerSec: 4,
  limitLoadFactor: 3.8,
} as const;

export const WEIGHT_N = C172S.massKg * G;

/** Zero-lift angle of attack (rad) for a flap position in degrees. */
export function alpha0(flapDeg: number): number {
  return (C172S.alpha0CleanDeg + C172S.alpha0PerFlapDeg * flapDeg) * DEG_TO_RAD;
}

export function cd0(flapDeg: number): number {
  return C172S.cd0Clean + C172S.cd0PerFlapDeg * flapDeg;
}

/** CLmax calibrated from the POH stall speed at max gross (weight cancels: CL is a wing property). */
function clMaxFromVs(vsKcas: number): number {
  const v = vsKcas * KT_TO_MS;
  const wPoh = C172S.pohGrossLb * 0.45359237 * G;
  return (2 * wPoh) / (RHO0 * v * v * C172S.wingAreaM2);
}
const CLMAX_CLEAN = clMaxFromVs(C172S.vs1KcasPoh);
const CLMAX_FULL = clMaxFromVs(C172S.vs0KcasPoh);

export function clMax(flapDeg: number): number {
  return CLMAX_CLEAN + (CLMAX_FULL - CLMAX_CLEAN) * (flapDeg / 30);
}

export function alphaStall(flapDeg: number): number {
  return alpha0(flapDeg) + clMax(flapDeg) / C172S.clAlpha;
}

/** Lift coefficient with a post-stall break. */
export function cl(alpha: number, flapDeg: number): number {
  const aStall = alphaStall(flapDeg);
  const max = clMax(flapDeg);
  if (alpha <= aStall) return C172S.clAlpha * (alpha - alpha0(flapDeg));
  return Math.max(0.6 * max, max - 0.8 * C172S.clAlpha * (alpha - aStall));
}

export function cd(alpha: number, flapDeg: number, clValue: number): number {
  const aStall = alphaStall(flapDeg);
  const over = Math.max(0, alpha - aStall);
  return cd0(flapDeg) + C172S.kInduced * clValue * clValue + 5 * over * over;
}

/** Propeller thrust (N) at full throttle fraction, airspeed and altitude. */
export function thrust(throttle: number, tasMs: number, altM: number, engineOut: boolean): number {
  if (engineOut) return 0;
  return Math.max(0, throttle) * sigma(altM) * Math.max(0, C172S.thrustStaticN - C172S.thrustSlope * tasMs);
}

/** Map a trim wheel position (−1..1) to trimmed angle of attack (rad). */
export function trimToAlpha(trim: number): number {
  const mid = (C172S.trimAlphaMaxDeg + C172S.trimAlphaMinDeg) / 2;
  const half = (C172S.trimAlphaMaxDeg - C172S.trimAlphaMinDeg) / 2;
  return (mid + trim * half) * DEG_TO_RAD;
}

export function alphaToTrim(alphaRad: number): number {
  const mid = (C172S.trimAlphaMaxDeg + C172S.trimAlphaMinDeg) / 2;
  const half = (C172S.trimAlphaMaxDeg - C172S.trimAlphaMinDeg) / 2;
  return Math.max(-1, Math.min(1, (alphaRad / DEG_TO_RAD - mid) / half));
}

/** Hands-off level flight solution at an indicated airspeed, flap setting and altitude. */
export function trimFor(iasKt: number, flapDeg: number, altM: number): { alpha: number; throttle: number; trim: number; tas: number } {
  const s = sigma(altM);
  const tas = (iasKt * KT_TO_MS) / Math.sqrt(s);
  const q = 0.5 * RHO0 * s * tas * tas;
  const clReq = WEIGHT_N / (q * C172S.wingAreaM2);
  const alpha = alpha0(flapDeg) + clReq / C172S.clAlpha;
  const drag = cd(alpha, flapDeg, clReq) * q * C172S.wingAreaM2;
  const tFull = thrust(1, tas, altM, false);
  const throttle = tFull > 0 ? Math.max(0, Math.min(1, drag / tFull)) : 1;
  return { alpha, throttle, trim: alphaToTrim(alpha), tas };
}
