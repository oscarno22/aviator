"use client";

import { useEffect, useRef, useState } from "react";
import type { TouchSource } from "@/sim/io/touch";
import type { ControlInputs } from "@/sim/types";
import { FLAP_SETTINGS } from "@/sim/types";

/** Virtual stick + throttle + rudder + flaps/trim buttons for phones and tablets. */
export default function TouchControls({ source, inputs }: { source: TouchSource; inputs: ControlInputs }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-end gap-3 select-none">
      <Throttle source={source} value={inputs.throttle} />
      <div className="flex flex-col items-center gap-2">
        <Stick source={source} />
        <Rudder source={source} />
      </div>
      <div className="flex flex-col gap-2">
        <Stepper label="Flaps" value={`${inputs.flaps}°`}
          onDown={() => source.setFlaps(FLAP_SETTINGS[Math.min(3, FLAP_SETTINGS.indexOf(inputs.flaps) + 1)])}
          onUp={() => source.setFlaps(FLAP_SETTINGS[Math.max(0, FLAP_SETTINGS.indexOf(inputs.flaps) - 1)])}
          downLabel="+" upLabel="−" />
        <Stepper label="Trim" value={inputs.trim.toFixed(2)} onDown={() => source.setTrim(Math.max(-1, inputs.trim - 0.03))} onUp={() => source.setTrim(Math.min(1, inputs.trim + 0.03))} downLabel="ND" upLabel="NU" />
      </div>
    </div>
  );
}

function Stick({ source }: { source: TouchSource }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const el = ref.current!;
    let active = false;
    const update = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const half = rect.width / 2;
      const x = Math.max(-1, Math.min(1, (e.clientX - rect.left - half) / half));
      const y = Math.max(-1, Math.min(1, (e.clientY - rect.top - half) / half));
      setPos({ x, y });
      source.setStick(y, x, true); // pull down on screen = nose up
    };
    const down = (e: PointerEvent) => { active = true; el.setPointerCapture(e.pointerId); update(e); };
    const move = (e: PointerEvent) => { if (active) update(e); };
    const up = () => { active = false; setPos({ x: 0, y: 0 }); source.setStick(0, 0, false); };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); };
  }, [source]);
  return (
    <div ref={ref} className="relative h-36 w-36 rounded-full border border-border bg-surface-2 touch-none" aria-label="Control stick">
      <div className="absolute inset-0 m-auto h-px w-full bg-border" /><div className="absolute inset-0 m-auto h-full w-px bg-border" />
      <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/90 shadow" style={{ transform: `translate(calc(-50% + ${pos.x * 40}px), calc(-50% + ${pos.y * 40}px))` }} />
    </div>
  );
}

function Rudder({ source }: { source: TouchSource }) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current!;
    let active = false;
    const update = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((e.clientX - rect.left) / rect.width) * 2 - 1));
      setV(x); source.setRudder(x);
    };
    const down = (e: PointerEvent) => { active = true; el.setPointerCapture(e.pointerId); update(e); };
    const move = (e: PointerEvent) => { if (active) update(e); };
    const up = () => { active = false; setV(0); source.setRudder(null); };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); };
  }, [source]);
  return (
    <div ref={ref} className="relative h-8 w-36 rounded-full border border-border bg-surface-2 touch-none" aria-label="Rudder">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted">RUD</span>
      <div className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-sky" style={{ left: `calc(50% + ${v * 52}px - 12px)` }} />
    </div>
  );
}

function Throttle({ source, value }: { source: TouchSource; value: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    let active = false;
    const update = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const t = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
      source.setThrottle(t);
    };
    const down = (e: PointerEvent) => { active = true; el.setPointerCapture(e.pointerId); update(e); };
    const move = (e: PointerEvent) => { if (active) update(e); };
    const up = () => { active = false; };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    return () => { el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); };
  }, [source]);
  return (
    <div className="flex flex-col items-center gap-1">
      <div ref={ref} className="relative h-44 w-10 rounded-full border border-border bg-surface-2 touch-none" aria-label="Throttle">
        <div className="absolute inset-x-1 bottom-1 rounded-full bg-accent/30" style={{ height: `calc(${value * 100}% - 4px)` }} />
        <div className="absolute left-1/2 h-4 w-12 -translate-x-1/2 rounded bg-fg shadow" style={{ top: `calc(${(1 - value) * 100}% - 8px)` }} />
      </div>
      <span className="text-[10px] text-muted">THR {(value * 100).toFixed(0)}%</span>
    </div>
  );
}

function Stepper({ label, value, onDown, onUp, downLabel, upLabel }: { label: string; value: string; onDown: () => void; onUp: () => void; downLabel: string; upLabel: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-surface-2 p-1">
      <span className="text-[10px] text-muted">{label}</span>
      <button className="h-9 w-14 rounded-lg text-sm font-semibold active:bg-surface" onClick={onUp}>{upLabel}</button>
      <span className="font-mono text-xs tabular">{value}</span>
      <button className="h-9 w-14 rounded-lg text-sm font-semibold active:bg-surface" onClick={onDown}>{downLabel}</button>
    </div>
  );
}
