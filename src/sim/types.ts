/** Internal units are SI and radians. Convert only in readout(). */
export type FlapSetting = 0 | 10 | 20 | 30;
export const FLAP_SETTINGS: FlapSetting[] = [0, 10, 20, 30];

export interface ControlInputs {
  elevator: number;  // −1..1, + aft (nose up); self-centering
  aileron: number;   // −1..1, + right; self-centering
  rudder: number;    // −1..1, + right; self-centering
  throttle: number;  // 0..1; persistent
  flaps: FlapSetting; // persistent
  trim: number;      // −1..1, + nose up; persistent
}

export const DEFAULT_INPUTS: ControlInputs = { elevator: 0, aileron: 0, rudder: 0, throttle: 0.6, flaps: 0, trim: 0 };

export interface SimState {
  t: number;         // s since reset
  x: number;         // m east
  y: number;         // m north
  alt: number;       // m MSL
  hdg: number;       // rad [0, 2π)
  tas: number;       // m/s
  gamma: number;     // rad flight-path angle
  alpha: number;     // rad angle of attack (lagged)
  bank: number;      // rad, + right
  rollRate: number;  // rad/s (lagged)
  yawRate: number;   // rad/s
  rpm: number;       // lagged
  flaps: number;     // deg, actual position
  ball: number;      // −1..1, + right
  vsInd: number;     // m/s, lagged VSI
  nz: number;        // load factor
  stalled: boolean;
  horn: boolean;
  crashed: boolean;
  overstress: boolean;
  engineOut: boolean;
}

/** Aviation units for instruments, sinks and scoring. */
export interface InstrumentReadout {
  ias: number;       // kt
  tas: number;       // kt
  alt: number;       // ft MSL
  hdg: number;       // deg [0, 360)
  vs: number;        // fpm (lagged)
  pitch: number;     // deg
  bank: number;      // deg, + right
  turnRate: number;  // deg/s, + right
  rollRate: number;  // deg/s
  ball: number;      // −1..1
  rpm: number;
  flaps: number;     // deg
  g: number;
  horn: boolean;
  stalled: boolean;
  crashed: boolean;
  engineOut: boolean;
}

export interface SimSnapshot {
  t: number;
  state: SimState;
  readout: InstrumentReadout;
  inputs: ControlInputs;
  paused: boolean;
}
