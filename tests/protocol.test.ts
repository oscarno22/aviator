import { describe, expect, it } from "vitest";
import { LineSplitter, ctlToInputs, encodeState, parseLine } from "@/sim/io/protocol";
import { initialState, readout } from "@/sim/engine";
import { mergeInputs } from "@/sim/io/merge";
import type { InputSource } from "@/sim/io/types";
import { DEFAULT_INPUTS } from "@/sim/types";

describe("serial protocol", () => {
  it("encodes a state line with the documented fields", () => {
    const { state, inputs } = initialState({ altFt: 3000, iasKt: 100, hdgDeg: 270 });
    const line = encodeState({ t: 0, state, readout: readout(state), inputs, paused: false });
    expect(line.endsWith("\n")).toBe(true);
    const m = JSON.parse(line);
    expect(m.t).toBe("state");
    expect(m.v).toBe(1);
    expect(m.alt).toBe(3000);
    expect(m.hdg).toBe(270);
    expect(Math.abs(m.ias - 100)).toBeLessThan(0.2);
    for (const k of ["vs", "pitch", "bank", "tr", "ball", "rpm", "flaps", "g", "horn", "stall", "paused"]) expect(m).toHaveProperty(k);
  });

  it("parses ctl lines, clamps and snaps flaps", () => {
    const m = parseLine('{"t":"ctl","v":1,"ele":-1.7,"ail":0.3,"thr":0.8,"flaps":12}');
    expect(m).toEqual({ t: "ctl", ele: -1, ail: 0.3, thr: 0.8, flaps: 10 });
    expect(ctlToInputs(m as never)).toEqual({ elevator: -1, aileron: 0.3, throttle: 0.8, flaps: 10 });
  });

  it("ignores garbage and unknown types", () => {
    expect(parseLine("not json")).toBeNull();
    expect(parseLine('{"t":"weird"}')).toBeNull();
    expect(parseLine('{"t":"ctl","ele":"x"}')).toEqual({ t: "ctl" });
    expect(parseLine("")).toBeNull();
  });

  it("parses hello/log/ping", () => {
    expect(parseLine('{"t":"hello","v":1,"name":"yoke-v1","caps":["ele","ail"],"rate":20}')).toEqual({ t: "hello", name: "yoke-v1", caps: ["ele", "ail"], rate: 20 });
    expect(parseLine('{"t":"log","msg":"hi"}')).toEqual({ t: "log", msg: "hi" });
    expect(parseLine('{"t":"ping","n":3}')).toEqual({ t: "ping", n: 3 });
  });

  it("splits streamed chunks into lines", () => {
    const s = new LineSplitter();
    expect(s.push('{"t":"pi')).toEqual([]);
    expect(s.push('ng"}\n{"t":"log","msg":"a"}\n{"t"')).toEqual(['{"t":"ping"}', '{"t":"log","msg":"a"}']);
    expect(s.push(':"pong"}\n')).toEqual(['{"t":"pong"}']);
  });
});

describe("input merge", () => {
  const src = (id: string, priority: number, part: Partial<typeof DEFAULT_INPUTS> | null): InputSource =>
    ({ id, priority, start() {}, stop() {}, poll: () => part });

  it("higher priority wins per axis; self-centering axes default to 0; persistent keep last", () => {
    const prev = { ...DEFAULT_INPUTS, elevator: 0.5, throttle: 0.7, trim: 0.2 };
    const next = mergeInputs(prev, [src("kb", 10, { elevator: 0.2, throttle: 0.9 }), src("pad", 30, { elevator: -0.4 })], 1 / 60);
    expect(next.elevator).toBe(-0.4);   // pad beats keyboard
    expect(next.throttle).toBe(0.9);    // only keyboard asserted throttle
    expect(next.aileron).toBe(0);       // nobody asserted → centered
    expect(next.trim).toBe(0.2);        // persistent, kept
  });

  it("clamps out-of-range values", () => {
    const next = mergeInputs(DEFAULT_INPUTS, [src("x", 1, { elevator: 5, throttle: -2 })], 1 / 60);
    expect(next.elevator).toBe(1);
    expect(next.throttle).toBe(0);
  });
});
