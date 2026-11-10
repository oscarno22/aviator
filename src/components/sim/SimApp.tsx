"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SimLoop } from "@/sim/loop";
import { createSimStore, useSimSnapshot } from "@/sim/store";
import { initialState } from "@/sim/engine";
import { KeyboardSource } from "@/sim/io/keyboard";
import { GamepadSource } from "@/sim/io/gamepad";
import { TouchSource } from "@/sim/io/touch";
import { SerialBridge, serialSupported } from "@/sim/io/serial";
import { ScoreRecorder, type TaskResult } from "@/sim/scoring";
import { TASKS, taskById, type PracticeTask } from "@/sim/tasks";
import type { InstrumentReadout } from "@/sim/types";
import { StallHorn } from "@/lib/audio";
import { settingsKey } from "@/lib/settings";
import { simResultsKey, MAX_RESULTS } from "@/lib/simResults";
import { useStored, useHydrated } from "@/lib/useStored";
import { useMediaQuery } from "@/lib/useMediaQuery";
import Panel from "./Panel";
import TouchControls from "./TouchControls";
import KeyHelp from "./KeyHelp";
import TaskPicker from "./TaskPicker";
import TaskHud from "./TaskHud";
import Debrief from "./Debrief";
import SerialConnect from "./SerialConnect";
import Button from "@/components/ui/Button";
import Icon from "@/components/Icon";

type Mode = "free" | "brief" | "task" | "debrief";

// Module-level singletons: the sim rig lives outside React and is never re-created by renders.
const store = createSimStore();
const touch = new TouchSource();
const horn = new StallHorn();
const serial: SerialBridge | null = serialSupported() ? new SerialBridge() : null;
const handlers = { reset: () => {} };

export default function SimApp() {
  const params = useSearchParams();
  const hydrated = useHydrated();
  const coarse = useMediaQuery("(pointer: coarse)");
  const [settings, setSettings] = useStored(settingsKey);
  const [, setResults] = useStored(simResultsKey);

  const loopRef = useRef<SimLoop | null>(null);
  const recorder = useRef<ScoreRecorder | null>(null);

  const linkedTask = taskById(params.get("task") ?? "") ?? null;
  const [mode, setMode] = useState<Mode>(linkedTask ? "brief" : "free");
  const [task, setTask] = useState<PracticeTask | null>(linkedTask);
  const [result, setResult] = useState<TaskResult | null>(null);
  const [entry, setEntry] = useState<InstrumentReadout | null>(null);
  const [covered, setCovered] = useState(false);
  const [touchOverride, setTouchOverride] = useState<boolean | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showSide, setShowSide] = useState(true);
  const [live, setLive] = useState({ elapsed: 0, hud: "" });
  const showTouch = touchOverride ?? coarse;

  const snap = useSimSnapshot(store);
  const r = snap.readout;

  // ---- create the loop once (StrictMode-safe: cleanup stops it, the effect recreates it)
  useEffect(() => {
    const init = initialState({ altFt: 3000, iasKt: 100, hdgDeg: 360 });
    const loop = new SimLoop(init);
    loop.onFrame = (s) => store.set(s);
    const kb = new KeyboardSource(init.inputs);
    kb.onPause = () => loop.togglePause();
    kb.onReset = () => handlers.reset();
    loop.addSource(kb);
    loop.addSource(new GamepadSource(init.inputs));
    loop.addSource(touch);
    loop.addSink({ id: "horn", rateHz: 20, update: (s) => horn.set(s.readout.horn && !s.paused) });
    loop.paused = true;
    loopRef.current = loop;
    loop.start();
    store.set(loop.snapshot());
    if (process.env.NODE_ENV !== "production") (window as unknown as { __aviator?: unknown }).__aviator = { loop, store };
    const unlock = () => horn.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      loop.stop();
      loopRef.current = null;
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => { if (loopRef.current) loopRef.current.options.turbulence = settings.turbulence; }, [settings.turbulence]);
  useEffect(() => { horn.enabled = settings.voiceEnabled; }, [settings.voiceEnabled]);

  // ---- task lifecycle
  const endTask = useCallback(() => {
    const loop = loopRef.current;
    if (recorder.current) { loop?.removeSink("score"); recorder.current.finish(); recorder.current = null; }
    if (loop) loop.onStep = undefined;
    setCovered(false);
  }, []);

  const startTask = useCallback((t: PracticeTask) => {
    const loop = loopRef.current;
    if (!loop) return;
    endTask();
    const setup = t.setup();
    loop.reset({ state: setup.state, inputs: setup.inputs });
    loop.setPaused(false);
    const rec = new ScoreRecorder(t, loop.snapshot());
    rec.onSample = (ctx) => setLive({ elapsed: ctx.elapsed, hud: t.hud?.(ctx) ?? t.description });
    rec.onDone = (res) => {
      loop.setPaused(true);
      loop.onStep = undefined;
      loop.removeSink("score");
      recorder.current = null;
      setResult(res);
      setMode("debrief");
      setResults((prev) => [res, ...prev].slice(0, MAX_RESULTS));
    };
    recorder.current = rec;
    loop.addSink(rec);
    loop.onStep = () => (t.event && recorder.current ? t.event(recorder.current.ctx) : null);
    setEntry(rec.ctx.entry);
    setTask(t);
    setMode("task");
    setResult(null);
    setLive({ elapsed: 0, hud: t.hud?.(rec.ctx) ?? t.description });
    if (setup.coverInstrumentsSec) {
      setCovered(true);
      setTimeout(() => setCovered(false), setup.coverInstrumentsSec * 1000);
    }
  }, [endTask, setResults]);

  const resetFree = useCallback(() => {
    const loop = loopRef.current;
    if (!loop) return;
    endTask();
    loop.reset(initialState({ altFt: 3000, iasKt: 100, hdgDeg: 360 }));
    loop.setPaused(false);
    setTask(null);
    setMode("free");
    setResult(null);
  }, [endTask]);

  useEffect(() => {
    handlers.reset = () => (task ? startTask(task) : resetFree());
  }, [task, startTask, resetFree]);

  const pick = (t: PracticeTask | null) => {
    if (!t) { resetFree(); return; }
    setTask(t); setMode("brief"); setResult(null);
    loopRef.current?.setPaused(true);
  };

  const paused = snap.paused;

  return (
    <div className="sim-root flex min-h-dvh flex-col bg-bg pt-[var(--sat)] pb-[var(--sab)]">
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <Link href="/" className="flex items-center gap-1 text-sm text-muted hover:text-fg"><Icon name="chevron" size={16} className="rotate-180" /> Aviator</Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => loopRef.current?.togglePause()} aria-label={paused ? "Resume" : "Pause"}>
            <Icon name={paused ? "play" : "pause"} size={16} /> {paused ? "Fly" : "Pause"}
          </Button>
          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => handlers.reset()} aria-label="Reset"><Icon name="reset" size={16} /> Reset</Button>
          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setSettings((p) => ({ ...p, panelStyle: p.panelStyle === "pfd" ? "sixpack" : "pfd" }))}>{settings.panelStyle === "pfd" ? "Round" : "Glass"}</Button>
          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setTouchOverride(!showTouch)} aria-pressed={showTouch}>Touch</Button>
          <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setShowHelp((v) => !v)} aria-pressed={showHelp}>Keys</Button>
          <Button variant="ghost" className="h-8 px-2 text-xs md:hidden" onClick={() => setShowSide((v) => !v)}>Tasks</Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-3 p-3 md:flex-row">
        <main className="flex-1 min-w-0">
          <Panel r={r} inputs={snap.inputs} covered={covered} hobbs={snap.t / 3600} style={hydrated ? settings.panelStyle : "sixpack"} />
          {showHelp && <div className="mt-3 rounded-xl border border-border bg-surface p-3"><KeyHelp /></div>}
          {showTouch && hydrated && <div className="mt-3 rounded-xl border border-border bg-surface p-3"><TouchControls source={touch} inputs={snap.inputs} /></div>}
          {paused && mode !== "brief" && mode !== "debrief" && (
            <p className="mt-3 text-center text-xs text-muted">Paused. Press Fly (or P) to start. Keyboard: arrows fly, W/S throttle. Trimmed for 100 kt at 3,000 ft.</p>
          )}
        </main>

        <aside className={`w-full shrink-0 space-y-3 md:w-80 ${showSide ? "" : "hidden md:block"}`}>
          {mode === "task" && task && entry && (
            <TaskHud task={task} entry={entry} r={r} elapsed={live.elapsed} hud={live.hud} onEnd={endTask} />
          )}
          {mode === "brief" && task && (
            <div className="rounded-xl border border-accent/40 bg-surface p-3">
              <p className="text-xs uppercase tracking-wide text-muted">{task.acsRef}</p>
              <h2 className="text-base font-semibold">{task.title}</h2>
              <p className="mt-1 text-sm text-fg/90">{task.description}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">{task.briefing.map((b) => <li key={b}>{b}</li>)}</ul>
              <div className="mt-3 flex gap-2">
                <Button variant="primary" onClick={() => startTask(task)}><Icon name="play" size={16} /> Start</Button>
                <Button onClick={resetFree}>Cancel</Button>
              </div>
            </div>
          )}
          {mode === "debrief" && result && task && (
            <Debrief result={result} onRetry={() => startTask(task)} onClose={resetFree} />
          )}
          <div className="rounded-xl border border-border bg-surface">
            <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">Practice tasks</p>
            <TaskPicker onPick={pick} current={task} />
          </div>
          {hydrated && serial && (
            <div className="rounded-xl border border-border bg-surface p-3">
              <SerialConnect bridge={serial} onConnected={() => { loopRef.current?.addSource(serial); loopRef.current?.addSink(serial); }} />
            </div>
          )}
          <p className="px-1 text-[11px] text-muted">{TASKS.length} tasks graded to Private Pilot ACS tolerances. Turbulence and sounds live in Settings.</p>
        </aside>
      </div>
    </div>
  );
}
