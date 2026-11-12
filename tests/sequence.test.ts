import { describe, expect, it } from "vitest";
import { FIXED_DT, initialState, readout, step, zeroGust, type StepEnv } from "@/sim/engine";
import { ScoreRecorder, flapSpeedFindings, gradeSequence, gradeTask, sequencePasses, type TaskResult } from "@/sim/scoring";
import { defaultRunway, taskById, type PracticeTask, type TaskContext } from "@/sim/tasks";
import { glidepathHeightM, type Gates } from "@/sim/pattern";
import { relHeadingDeg, toFrame, type RunwayFrame } from "@/sim/world";
import { FLAP_LIMITS, PATTERN, SPEEDS, type SequenceSpec } from "@/data/procedures";
import { M_TO_FT, NM_TO_M, clamp } from "@/lib/units";
import type { ControlInputs, FlapSetting, SimSnapshot, SimState } from "@/sim/types";

// ------------------------------------------------------------------ synthetic contexts

type Frame = { flaps?: FlapSetting; flapPos?: number; rpm?: number; throttle?: number; ias?: number; alt?: number };

/** One 10 Hz sample per frame, built on a real trimmed state so every field is present. */
function ctxFrom(frames: Frame[], gates: Gates): TaskContext {
  const { state, inputs } = initialState({ altFt: 1700, iasKt: 90 });
  const base = readout(state);
  const samples: SimSnapshot[] = frames.map((f, i) => ({
    t: i / 10, state,
    readout: { ...base, rpm: f.rpm ?? 1900, ias: f.ias ?? 90, alt: f.alt ?? 1700, flaps: f.flapPos ?? f.flaps ?? 0 },
    inputs: { ...inputs, flaps: f.flaps ?? 0, throttle: f.throttle ?? 0.6 },
    paused: false,
  }));
  return { entry: base, samples, elapsed: samples.length / 10, latest: samples[samples.length - 1], memo: {}, gates };
}

const frames = (n: number, fn: (tSec: number) => Frame) => Array.from({ length: n }, (_, i) => fn(i / 10));

const SPEC: SequenceSpec = {
  limits: FLAP_LIMITS,
  steps: [
    { id: "f10", label: "Flaps 10", from: "abeam", to: { sec: 10 }, check: { kind: "flaps", eq: 10 }, critical: true },
    { id: "ias", label: "80 knots", from: "abeam", to: "baseTurn", check: { kind: "ias", min: 75, max: 85 } },
  ],
};
const GATES: Gates = { start: 0, abeam: 100, baseTurn: 400 };

describe("gradeSequence", () => {
  it("marks a step done inside its window as on time", () => {
    const ctx = ctxFrom(frames(500, (t) => ({ flaps: t >= 13 ? 10 : 0, ias: t >= 25 ? 80 : 90 })), GATES);
    const [flap, ias] = gradeSequence(SPEC, ctx);
    expect(flap.status).toBe("onTime");
    expect(flap.atSec).toBeCloseTo(13, 5);
    expect(flap.fromSec).toBe(10);
    expect(flap.toSec).toBe(20);
    expect(ias.status).toBe("onTime");
    expect(sequencePasses([flap, ias])).toBe(true);
  });

  it("allows a short lead but marks anything sooner as early", () => {
    const lead = ctxFrom(frames(500, (t) => ({ flaps: t >= 8.5 ? 10 : 0 })), GATES);
    expect(gradeSequence(SPEC, lead)[0].status).toBe("onTime");
    const early = ctxFrom(frames(500, (t) => ({ flaps: t >= 4 ? 10 : 0 })), GATES);
    const res = gradeSequence(SPEC, early);
    expect(res[0].status).toBe("early");
    expect(res[0].atSec).toBeCloseTo(4, 5);
    expect(sequencePasses(res)).toBe(false); // critical and early
  });

  it("marks a step done after its window as late, and never done as missed", () => {
    const late = ctxFrom(frames(500, (t) => ({ flaps: t >= 31 ? 10 : 0, ias: 80 })), GATES);
    const l = gradeSequence(SPEC, late);
    expect(l[0].status).toBe("late");
    expect(sequencePasses(l)).toBe(true); // one late step is allowed
    const missed = ctxFrom(frames(500, () => ({ flaps: 0, ias: 80 })), GATES);
    const m = gradeSequence(SPEC, missed);
    expect(m[0].status).toBe("missed");
    expect(sequencePasses(m)).toBe(false); // critical and missed
  });

  it("does not call airspeed early, and misses steps whose gate never came", () => {
    const ctx = ctxFrom(frames(500, () => ({ flaps: 0, ias: 80 })), { start: 0 });
    expect(gradeSequence(SPEC, ctx).map((s) => s.status)).toEqual(["missed", "missed"]);
    const already = ctxFrom(frames(500, (t) => ({ flaps: t >= 12 ? 10 : 0, ias: 80 })), GATES);
    expect(gradeSequence(SPEC, already)[1].status).toBe("onTime");
  });

  it("fails on two late steps even when none is critical", () => {
    const spec: SequenceSpec = { limits: FLAP_LIMITS, steps: [
      { id: "a", label: "a", from: "start", to: { sec: 5 }, check: { kind: "rpm", min: 1400, max: 1700 } },
      { id: "b", label: "b", from: "start", to: { sec: 5 }, check: { kind: "throttle", min: 0.95 } },
    ] };
    const ctx = ctxFrom(frames(200, (t) => ({ rpm: t > 8 ? 1500 : 1900, throttle: t > 9 ? 1 : 0.5 })), { start: 0 });
    const res = gradeSequence(spec, ctx);
    expect(res.map((s) => s.status)).toEqual(["late", "late"]);
    expect(sequencePasses(res)).toBe(false);
  });
});

describe("flap speed limits", () => {
  it("flags flaps past 10 above Vfe and passes inside the limits", () => {
    const ok = ctxFrom(frames(100, () => ({ flapPos: 10, ias: 105 })), {});
    expect(flapSpeedFindings(FLAP_LIMITS, ok.samples)).toEqual([]);
    const over = ctxFrom(frames(100, (t) => ({ flapPos: 20, ias: t > 5 ? 92 : 80 })), {});
    const f = flapSpeedFindings(FLAP_LIMITS, over.samples);
    expect(f).toHaveLength(1);
    expect(f[0].severity).toBe("fail");
    expect(f[0].text).toContain("85");
    const over10 = ctxFrom(frames(100, () => ({ flapPos: 10, ias: 115 })), {});
    expect(flapSpeedFindings(FLAP_LIMITS, over10.samples)[0].text).toContain("110");
  });

  it("fails the pattern task on a flap overspeed even with every step on time", () => {
    const task = taskById("pattern-downwind")!;
    const gates: Gates = { start: 0, abeam: 100, baseTurn: 400, finalEstablished: 700, agl300: 800, threshold: 1000 };
    const run = (downwindIas: number) => gradeTask(task, ctxFrom(frames(1001, (t) => ({
      flaps: t >= 72 ? 30 : t >= 42 ? 20 : t >= 11 ? 10 : 0,
      rpm: t >= 11 ? 1500 : 1900,
      ias: t >= 72 ? 65 : t >= 42 ? 70 : t >= 13 ? 80 : downwindIas,
      alt: 1700,
    })), gates));
    const good = run(90);
    expect(good.sequence!.map((s) => s.status)).toEqual(Array(6).fill("onTime"));
    expect(good.pass).toBe(true);
    // 118 kt on downwind with flaps 10 coming out at abeam + 1 s: over Vfe 110 for the first samples
    const bad = gradeTask(task, ctxFrom(frames(1001, (t) => ({
      flaps: t >= 72 ? 30 : t >= 42 ? 20 : t >= 11 ? 10 : 0,
      rpm: t >= 11 ? 1500 : 1900,
      ias: t >= 72 ? 65 : t >= 42 ? 70 : t >= 13 ? 80 : t >= 11 ? 118 : 95,
      alt: 1700,
    })), gates));
    expect(bad.sequence!.map((s) => s.status)).toEqual(Array(6).fill("onTime"));
    expect(bad.findings.some((f) => f.severity === "fail" && f.text.includes("110"))).toBe(true);
    expect(bad.pass).toBe(false);
  });
});

describe("segment-restricted parameters", () => {
  const task = taskById("pattern-downwind")!;
  const gates: Gates = { start: 0, abeam: 100, baseTurn: 400, finalEstablished: 700, agl300: 800, threshold: 1000 };
  const steps = (t: number): Frame => ({ flaps: t >= 72 ? 30 : t >= 42 ? 20 : t >= 11 ? 10 : 0, rpm: t >= 11 ? 1500 : 1900 });

  it("grades each band only on its own segment", () => {
    // Altitude leaves the downwind band after abeam (fine: descending), airspeed is 65 only from 300 ft down.
    const res = gradeTask(task, ctxFrom(frames(1001, (t) => ({
      ...steps(t), alt: t <= 10 ? 1700 : 1700 - (t - 10) * 10, ias: t >= 72 ? 65 : t >= 42 ? 70 : t >= 13 ? 80 : 90,
    })), gates));
    const alt = res.params.find((p) => p.label === "Downwind altitude")!;
    expect(alt.pctInTol).toBe(1);
    expect(alt.series.length).toBe(101); // start..abeam inclusive
    const fin = res.params.find((p) => p.label === "Final airspeed")!;
    expect(fin.pctInTol).toBe(1);
    expect(fin.series.length).toBe(201);
    expect(res.pass).toBe(true);
  });

  it("fails a band broken inside its segment and one whose segment never started", () => {
    const slow = gradeTask(task, ctxFrom(frames(1001, (t) => ({ ...steps(t), alt: 1700, ias: t >= 85 ? 55 : t >= 72 ? 65 : t >= 42 ? 70 : t >= 13 ? 80 : 90 })), gates));
    const fin = slow.params.find((p) => p.label === "Final airspeed")!;
    expect(fin.pass).toBe(false);
    expect(fin.maxDev).toBe(-10);
    expect(slow.pass).toBe(false);
    const noFinal = gradeTask(task, ctxFrom(frames(500, (t) => ({ ...steps(t), alt: 1700, ias: 90 })), { start: 0, abeam: 100 }));
    expect(noFinal.params.find((p) => p.label === "Final airspeed")!.pass).toBe(false);
  });

  it("reports an unrecognised pattern as ungraded rather than as a failed sequence", () => {
    const ctx = ctxFrom(frames(300, () => ({ alt: 1700, ias: 90 })), { start: 0 });
    ctx.lost = "Off the downwind leg for 30 seconds.";
    const res = gradeTask(task, ctx);
    expect(res.ungraded).toBe(true);
    expect(res.sequence).toBeUndefined();
    expect(res.pass).toBe(false);
    expect(res.findings[0].text).toContain("Pattern not recognised");
  });
});

// ------------------------------------------------------------------ scripted pilot through the real engine

type Phase = "roll" | "upwind" | "crosswind" | "downwind" | "base" | "final" | "flare" | "rollout" | "goAround";
interface PilotLog { phases: Phase[] }

const wrap180 = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

/**
 * A simple autopilot that flies by the same cues a student has: the pattern map
 * position, the instruments and the HUD call. It never reads the grader's gates.
 */
function makePilot(task: PracticeTask, f: RunwayFrame, start: Phase, log: PilotLog = { phases: [] }) {
  const dt = FIXED_DT;
  const offset = PATTERN.downwindOffsetNm * NM_TO_M;
  const side = f.patternSide === "left" ? -1 : 1;
  const patternAglFt = (f.patternAltM - f.elevM) * M_TO_FT;
  let phase: Phase = start;
  log.phases.push(phase);
  let vsInteg = 0, spdInteg = 0, thrInteg: number | null = null;
  let abeamAt: number | null = null, climbSecs = 0, positiveAt: number | null = null;
  let crosswindAlong = 0;
  let prevAlong: number | null = null;

  const go = (p: Phase) => { phase = p; log.phases.push(p); };

  return (s: SimState, u: ControlInputs, ctx: TaskContext): ControlInputs => {
    const env: StepEnv = { groundElevM: f.elevM, runway: f };
    const r = readout(s, env);
    const { along, cross } = toFrame(f, s.x, s.y);
    const theta = (relHeadingDeg(f, s.hdg) + 360) % 360;   // 0 upwind, 90 crosswind, 180 downwind, 270 base
    const vsNow = s.tas * Math.sin(s.gamma) * 196.85;
    const turnR = (s.tas * s.tas) / (9.81 * Math.tan((22 * Math.PI) / 180));
    const out: ControlInputs = { ...u, elevator: 0, aileron: 0, rudder: 0 };

    // ---- inner loops
    const flyVs = (vsCmd: number) => {
      const e = vsCmd - vsNow;
      vsInteg = clamp(vsInteg + e * dt * 0.0002, -1, 1);
      out.elevator = clamp(e * 0.0004 + vsInteg, -1, 1);
    };
    const pitchForSpeed = (kt: number, lo = -900, hi = 900) => {
      const e = r.ias - kt;
      if (Math.abs(e) < 15) spdInteg = clamp(spdInteg + e * dt * 6, -800, 800); // no wind-up while far off speed
      flyVs(clamp(e * 60 + spdInteg, lo, hi));
    };
    const powerForSpeed = (kt: number) => {
      if (thrInteg == null) thrInteg = u.throttle;
      const e = kt - r.ias;
      thrInteg = clamp(thrInteg + e * dt * 0.005, 0, 1);
      out.throttle = clamp(thrInteg + e * 0.03, 0, 1);
    };
    /** Follow a line through (a0, c0) in runway coordinates on course thetaCmd. */
    const followLine = (course: number, a0: number, c0: number) => {
      const rad = (course * Math.PI) / 180;
      const xte = -(along - a0) * Math.sin(rad) + (cross - c0) * Math.cos(rad);
      const cmd = course - clamp(xte * 0.08, -35, 35);
      const bankCmd = side * clamp(wrap180(cmd - theta) * 1.2, -25, 25);
      out.aileron = clamp((bankCmd - r.bank) * 0.08 - r.rollRate * 0.01, -1, 1);
    };
    /** Height above the runway of a 3 degree path, by distance still to fly round the pattern. */
    const profileFt = (toGo: number) => Math.min(patternAglFt, glidepathHeightM(-toGo) * M_TO_FT);
    const flyProfile = (toGo: number) => {
      const nominal = -s.tas * Math.tan((PATTERN.glidepathDeg * Math.PI) / 180) * 196.85;
      const target = profileFt(toGo);
      flyVs(clamp((target >= patternAglFt ? 0 : nominal) + (target - r.agl) * 6, -900, 400));
    };

    /** Rudder on the ground: hold the runway heading and the centreline (right of centreline is positive). */
    const steer = () => clamp(-0.15 * relHeadingDeg(f, s.hdg) * side - 0.05 * cross * side + 0.25 * u.throttle, -1, 1);

    switch (phase) {
      case "roll": {
        out.throttle = 1;
        out.rudder = steer();
        if (r.ias >= SPEEDS.rotate.target) out.elevator = 0.45;
        if (!s.onGround) { vsInteg = 0.45; go("upwind"); }
        break;
      }
      case "upwind": {
        out.throttle = 1;
        followLine(0, 0, 0);
        climbSecs = r.vs > 200 ? climbSecs + dt : 0;
        if (positiveAt == null && climbSecs > 2.5) positiveAt = s.t;
        if (positiveAt == null) flyVs(300);                                   // hold a climb until the VSI confirms it
        else pitchForSpeed(SPEEDS.vy.target, r.ias < SPEEDS.vy.min ? 100 : 250, 1200); // then let it accelerate to Vy
        if (positiveAt != null && r.ias >= SPEEDS.flapsUpMin) out.flaps = 0;
        if (task.id === "closed-pattern" && along > f.lengthM && r.agl >= patternAglFt - 300) { crosswindAlong = along + turnR; go("crosswind"); }
        break;
      }
      case "crosswind": {
        followLine(90, crosswindAlong, 0);
        if (cross >= offset - turnR) go("downwind");
        break;
      }
      case "downwind": {
        followLine(180, 0, offset);
        if (prevAlong != null && prevAlong > 0 && along <= 0 && abeamAt == null) abeamAt = s.t;
        if (along <= -offset + turnR) go("base");
        break;
      }
      case "base": {
        followLine(270, -offset, 0);
        if (theta > 225) out.flaps = 20;
        if (cross <= turnR) go("final");
        break;
      }
      case "final": {
        followLine(0, 0, 0);
        if ((theta <= 30 || theta >= 330) && Math.abs(cross) <= 250) out.flaps = 30;
        if (task.id === "go-around" && task.hud?.(ctx) === "GO AROUND") { go("goAround"); }
        else if (task.id === "closed-pattern" && r.agl <= 25) go("flare");
        break;
      }
      case "flare": {
        followLine(0, 0, 0);
        out.throttle = 0;
        flyVs(clamp(-40 - r.agl * 12, -350, -40));
        if (s.onGround) go("rollout");
        break;
      }
      case "rollout": {
        out.throttle = 0;
        out.rudder = steer();
        break;
      }
      case "goAround": {
        out.throttle = 1;
        followLine(0, 0, 0);
        climbSecs = r.vs > 200 ? climbSecs + dt : 0;
        if (positiveAt == null && climbSecs > 2.5) positiveAt = s.t;
        if (positiveAt == null) { out.flaps = 20; flyVs(350); }
        else if (r.ias < SPEEDS.vy.min + 1 && u.flaps !== 0) { out.flaps = 10; flyVs(150); }
        else { out.flaps = r.ias >= SPEEDS.flapsUpMin + 5 && s.t - positiveAt > 4 ? 0 : 10; pitchForSpeed(SPEEDS.vy.target, 100, 1200); }
        break;
      }
    }

    // ---- vertical and power for the airborne pattern legs
    if (phase === "crosswind" || phase === "downwind" || phase === "base" || phase === "final") {
      const climbing = phase === "crosswind" && r.agl < patternAglFt - 40 && abeamAt == null;
      if (climbing) { out.throttle = 1; pitchForSpeed(SPEEDS.vy.target, 100, 1200); thrInteg = 0.6; }
      else {
        const toGo = phase === "final" ? -along
          : phase === "base" ? Math.max(0, cross) + offset
          : abeamAt != null ? Math.max(0, along + offset) + 2 * offset
          : Infinity;
        if (toGo === Infinity) flyVs(clamp((patternAglFt - r.agl) * 6, -700, 700)); else flyProfile(toGo);
        const target = phase === "final" && u.flaps === 30 ? SPEEDS.final.target
          : phase === "base" || phase === "final" ? SPEEDS.base.target
          : abeamAt != null ? SPEEDS.abeam.target : PATTERN.downwindIasKt;
        if (abeamAt != null && s.t - abeamAt < 12) { out.throttle = 0.42; out.flaps = 10; thrInteg = 0.42; }
        else powerForSpeed(target);
      }
    }
    prevAlong = along;
    return out;
  };
}

interface Flight { result: TaskResult; ctx: TaskContext; log: PilotLog }

/** Run a task the way the app does: 60 Hz engine steps, 10 Hz samples into the real ScoreRecorder. */
function fly(taskId: string, start: Phase, frame: RunwayFrame = defaultRunway(), tweak?: (u: ControlInputs, s: SimState, ctx: TaskContext) => ControlInputs): Flight {
  const task = taskById(taskId)!;
  const env: StepEnv = { groundElevM: frame.elevM, runway: frame };
  const setup = task.setup(frame);
  let s = setup.state, u = setup.inputs;
  const snap = (): SimSnapshot => ({ t: s.t, state: s, readout: readout(s, env), inputs: u, paused: false });
  const rec = new ScoreRecorder(task, snap(), { runway: frame });
  let result: TaskResult | null = null;
  rec.onDone = (res) => { result = res; };
  const log: PilotLog = { phases: [] };
  const pilot = makePilot(task, frame, start, log);
  const gust = zeroGust();
  for (let i = 0; i < 60 * 1200 && !rec.done; i++) {
    u = pilot(s, u, rec.ctx);
    if (tweak) u = tweak(u, s, rec.ctx);
    s = step(s, u, FIXED_DT, { env }, gust);
    if ((i + 1) % 6 === 0) rec.update(snap());
  }
  if (!result) throw new Error("task never finished");
  return { result, ctx: rec.ctx, log };
}

const inOrder = (g: Gates, ids: (keyof Gates)[]) => {
  const idx = ids.map((id) => g[id]);
  for (const v of idx) expect(v).toBeTypeOf("number");
  for (let i = 1; i < idx.length; i++) expect(idx[i]!).toBeGreaterThanOrEqual(idx[i - 1]!);
};

describe("scripted pilot through the real engine", () => {
  it("pattern: gates fire in order and a correct run passes", () => {
    const { result, ctx } = fly("pattern-downwind", "downwind");
    inOrder(ctx.gates!, ["start", "abeam", "baseTurn", "finalEstablished", "agl300", "threshold"]);
    expect(ctx.gates!.goAround).toBeUndefined();
    expect(result.ungraded).toBeUndefined();
    expect(result.sequence!.map((s) => `${s.id}:${s.status}`)).toEqual(
      ["abeam-power", "flaps-10", "ias-80", "flaps-20", "ias-70", "flaps-30"].map((id) => `${id}:onTime`));
    expect(result.findings.filter((f) => f.severity === "fail")).toEqual([]);
    for (const p of result.params) expect(p.pass, p.label).toBe(true);
    expect(result.pass).toBe(true);
    expect(result.track!.length).toBeGreaterThan(50);
    expect(result.track!.length).toBeLessThanOrEqual(300);
    // crossed the threshold over the runway, at a sensible height
    const last = ctx.samples[ctx.gates!.threshold!];
    expect(Math.abs(toFrame(defaultRunway(), last.state.x, last.state.y).cross)).toBeLessThan(15);
    expect(last.readout.agl).toBeGreaterThan(20);
    expect(last.readout.agl).toBeLessThan(120);
  });
});

describe("scripted pilot: the other runway tasks", () => {
  it("go-around: the call comes, power and flaps follow in order, and it passes", () => {
    const { result, ctx } = fly("go-around", "final");
    inOrder(ctx.gates!, ["start", "goAround", "positiveRate"]);
    expect(result.sequence!.every((s) => s.status === "onTime")).toBe(true);
    expect(result.pass).toBe(true);
  });
  it("normal takeoff: lifts off, shows a climb, and passes", () => {
    const { result, ctx } = fly("normal-takeoff", "roll");
    inOrder(ctx.gates!, ["start", "liftoff", "positiveRate"]);
    expect(result.pass).toBe(true);
  });
  it("closed pattern: takeoff to touchdown with every gate in order", () => {
    const { result, ctx } = fly("closed-pattern", "roll");
    inOrder(ctx.gates!, ["start", "liftoff", "positiveRate", "abeam", "baseTurn", "finalEstablished", "agl300", "threshold", "touchdown"]);
    expect(result.findings.some((f) => f.text === "Landed on the runway.")).toBe(true);
    expect(result.pass).toBe(true);
  });
});
