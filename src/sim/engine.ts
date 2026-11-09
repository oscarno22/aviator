/**
 * Pure fixed-step integrator for the C172S point-mass model.
 * step() never mutates its input and always returns finite numbers.
 */
import { DEG_TO_RAD, FT_TO_M, G, KT_TO_MS, M_TO_FT, MS_TO_FPM, MS_TO_KT, RAD_TO_DEG, clamp, lag, wrapRad } from "@/lib/units";
import { RHO0, sigma } from "./atmosphere";
import { C172S, WEIGHT_N, alphaStall, cd, cl, thrust, trimFor, trimToAlpha } from "./aircraft/c172s";
import { type ControlInputs, type InstrumentReadout, type SimState, DEFAULT_INPUTS } from "./types";

export const FIXED_DT = 1 / 60;
const V_FLOOR = 10;      // m/s hard floor
const V_DEN = 15;        // m/s floor used in denominators
const ALT_CEILING = 6000; // m

export interface StepOptions {
  turbulence?: boolean;
  /** Deterministic RNG hook for tests; returns [0,1). */
  rng?: () => number;
}

/** Turbulence state kept outside SimState so the state stays a plain record. */
export interface Gust { alpha: number; roll: number }
export const zeroGust = (): Gust => ({ alpha: 0, roll: 0 });

export function step(s: SimState, u: ControlInputs, dt: number, opts: StepOptions = {}, gust: Gust = zeroGust()): SimState {
  if (s.crashed) return s;
  const rng = opts.rng ?? Math.random;

  // ---- flaps travel toward the selected detent
  const flaps = s.flaps < u.flaps ? Math.min(u.flaps, s.flaps + C172S.flapRateDegPerSec * dt)
    : s.flaps > u.flaps ? Math.max(u.flaps, s.flaps - C172S.flapRateDegPerSec * dt) : s.flaps;

  // ---- light turbulence: Ornstein–Uhlenbeck noise on α and roll
  if (opts.turbulence) {
    const theta = 0.8, sigA = 0.3 * DEG_TO_RAD, sigR = 1.0 * DEG_TO_RAD;
    const n1 = (rng() - 0.5) * 2 * Math.sqrt(3), n2 = (rng() - 0.5) * 2 * Math.sqrt(3);
    gust.alpha += -theta * gust.alpha * dt + sigA * Math.sqrt(2 * theta * dt) * n1;
    gust.roll += -theta * gust.roll * dt + sigR * Math.sqrt(2 * theta * dt) * n2;
  } else {
    gust.alpha = 0; gust.roll = 0;
  }

  // ---- pilot commands angle of attack through the elevator and trim
  const alphaCmd = trimToAlpha(u.trim) + u.elevator * C172S.elevatorAlphaDeg * DEG_TO_RAD;
  let alpha = lag(s.alpha, alphaCmd, C172S.alphaTau, dt) + gust.alpha;
  alpha = clamp(alpha, -10 * DEG_TO_RAD, 30 * DEG_TO_RAD);

  // ---- roll
  const v = Math.max(V_FLOOR, s.tas);
  const rollCmd = u.aileron * C172S.rollRateMaxDeg * DEG_TO_RAD * Math.min(1, v / C172S.rollRefSpeed);
  let rollRate = lag(s.rollRate, rollCmd, C172S.rollTau, dt);
  const bankDeg = s.bank * RAD_TO_DEG;
  const spiral = Math.abs(bankDeg) <= 35 ? -0.02 * bankDeg : 0.05 * (Math.abs(bankDeg) - 35) * Math.sign(bankDeg);
  rollRate += (spiral * DEG_TO_RAD) + gust.roll;
  let bank = clamp(s.bank + rollRate * dt, -90 * DEG_TO_RAD, 90 * DEG_TO_RAD);

  // ---- aero forces
  const sig = sigma(s.alt);
  const q = 0.5 * RHO0 * sig * v * v;
  const clv = cl(alpha, flaps);
  const cdv = cd(alpha, flaps, clv);
  const L = clv * q * C172S.wingAreaM2;
  const D = cdv * q * C172S.wingAreaM2;
  const T = thrust(u.throttle, v, s.alt, s.engineOut);
  const m = C172S.massKg;

  // ---- semi-implicit: speed first, then path angles with the new speed
  let tas = s.tas + ((T - D) / m - G * Math.sin(s.gamma)) * dt;
  tas = Math.max(V_FLOOR, tas);
  const vd = Math.max(V_DEN, tas);

  const gammaDot = (L * Math.cos(bank) - WEIGHT_N * Math.cos(s.gamma)) / (m * vd);
  let gamma = clamp(s.gamma + gammaDot * dt, -80 * DEG_TO_RAD, 80 * DEG_TO_RAD);

  const aStall = alphaStall(flaps);
  const pFactor = 0.4 * u.throttle * clamp((alpha * RAD_TO_DEG - 2) / 12, 0, 1) * (s.engineOut ? 0 : 1);
  const turnDot = (L * Math.sin(bank)) / (m * vd * Math.max(0.2, Math.cos(gamma)));
  const yawRate = turnDot + (u.rudder * C172S.rudderYawDeg - pFactor * 2) * DEG_TO_RAD;
  let hdg = wrapRad(s.hdg + yawRate * dt);

  const alt = Math.min(ALT_CEILING, s.alt + tas * Math.sin(gamma) * dt);
  const x = s.x + tas * Math.cos(gamma) * Math.sin(hdg) * dt;
  const y = s.y + tas * Math.cos(gamma) * Math.cos(hdg) * dt;

  // ---- instrument lags and flags
  const ballTarget = clamp(0.6 * u.aileron + pFactor - 1.0 * u.rudder, -1, 1);
  const ball = lag(s.ball, ballTarget, C172S.ballTau, dt);
  const rpmTarget = s.engineOut ? Math.min(900, 12 * tas) : 650 + u.throttle * 1900 + Math.max(0, tas - 25) * 3;
  const rpm = lag(s.rpm, Math.min(2750, rpmTarget), C172S.rpmTau, dt);
  const vsInd = lag(s.vsInd, tas * Math.sin(gamma), C172S.vsiTau, dt);
  const nz = L / WEIGHT_N;
  const stalled = alpha > aStall;
  const horn = alpha > aStall - C172S.hornMarginDeg * DEG_TO_RAD;
  const crashed = alt <= 0;

  const next: SimState = {
    t: s.t + dt, x, y, alt: Math.max(0, alt), hdg, tas, gamma, alpha, bank, rollRate, yawRate,
    rpm, flaps, ball, vsInd, nz, stalled, horn, crashed,
    overstress: s.overstress || nz > C172S.limitLoadFactor,
    engineOut: s.engineOut,
  };

  // ---- NaN guard: never let a bad frame poison the state
  for (const k in next) {
    const val = (next as unknown as Record<string, unknown>)[k];
    if (typeof val === "number" && !Number.isFinite(val)) return s;
  }
  if (crashed) { bank = 0; gamma = 0; hdg = s.hdg; }
  return next;
}

export function readout(s: SimState): InstrumentReadout {
  const sig = sigma(s.alt);
  return {
    ias: s.tas * Math.sqrt(sig) * MS_TO_KT,
    tas: s.tas * MS_TO_KT,
    alt: s.alt * M_TO_FT,
    hdg: (s.hdg * RAD_TO_DEG + 360) % 360,
    vs: s.vsInd * MS_TO_FPM,
    pitch: (s.gamma + s.alpha) * RAD_TO_DEG - C172S.incidenceDeg,
    bank: s.bank * RAD_TO_DEG,
    turnRate: s.yawRate * RAD_TO_DEG,
    rollRate: s.rollRate * RAD_TO_DEG,
    ball: s.ball,
    rpm: s.rpm,
    flaps: s.flaps,
    g: s.nz,
    horn: s.horn,
    stalled: s.stalled,
    crashed: s.crashed,
    engineOut: s.engineOut,
  };
}

export interface InitOptions {
  altFt?: number;
  iasKt?: number;
  hdgDeg?: number;
  flaps?: ControlInputs["flaps"];
  bankDeg?: number;
  pitchOffsetDeg?: number;  // extra γ for unusual attitudes
  engineOut?: boolean;
}

/** A trimmed, hands-off starting state plus the matching persistent inputs. */
export function initialState(o: InitOptions = {}): { state: SimState; inputs: ControlInputs } {
  const altFt = o.altFt ?? 3000, iasKt = o.iasKt ?? 100, hdgDeg = o.hdgDeg ?? 360, flaps = o.flaps ?? 0;
  const alt = altFt * FT_TO_M;
  const t = trimFor(iasKt, flaps, alt);
  const gamma = (o.pitchOffsetDeg ?? 0) * DEG_TO_RAD;
  const state: SimState = {
    t: 0, x: 0, y: 0, alt, hdg: wrapRad(hdgDeg * DEG_TO_RAD), tas: t.tas, gamma,
    alpha: t.alpha, bank: (o.bankDeg ?? 0) * DEG_TO_RAD, rollRate: 0, yawRate: 0,
    rpm: 650 + t.throttle * 1900 + Math.max(0, t.tas - 25) * 3, flaps, ball: 0,
    vsInd: t.tas * Math.sin(gamma), nz: 1, stalled: false, horn: false, crashed: false, overstress: false,
    engineOut: o.engineOut ?? false,
  };
  const inputs: ControlInputs = { ...DEFAULT_INPUTS, throttle: o.engineOut ? 0 : t.throttle, flaps, trim: t.trim };
  return { state, inputs };
}

export { KT_TO_MS };
