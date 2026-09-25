"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Maneuver } from "@/data/maneuvers";
import { speak, stopSpeaking, ttsSupported, unlockSpeech } from "@/lib/speech";
import { settingsKey } from "@/lib/settings";
import { useStored } from "@/lib/useStored";
import Icon from "@/components/Icon";

/**
 * Full-screen step-through for rehearsing a maneuver. Tap/Space to advance,
 * optional auto-advance on each step's duration, callouts read aloud.
 */
export default function ChairFly({ maneuver: m, onClose }: { maneuver: Maneuver; onClose: () => void }) {
  const [settings] = useStored(settingsKey);
  const [i, setI] = useState(0);
  const [auto, setAuto] = useState(false);
  const [voice, setVoice] = useState(settings.voiceEnabled && ttsSupported());
  const [progress, setProgress] = useState(0); // 0..1 within the current step
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);
  const step = m.steps[i];
  const last = i === m.steps.length - 1;

  const next = useCallback(() => setI((x) => Math.min(m.steps.length - 1, x + 1)), [m.steps.length]);
  const prev = useCallback(() => setI((x) => Math.max(0, x - 1)), []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  // Wake lock while chair-flying
  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((l) => { wakeLock.current = l; }).catch(() => {});
    return () => { wakeLock.current?.release().catch(() => {}); stopSpeaking(); };
  }, []);

  // Speak the step
  useEffect(() => {
    if (!voice) return;
    const text = step.callout ? `${step.action} Say: ${step.callout}.` : step.action;
    speak(text, { rate: settings.speechRate });
  }, [i, voice, step, settings.speechRate]);

  // Auto-advance
  useEffect(() => {
    if (!auto) return;
    const dur = (step.durationSec ?? 8) * 1000;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setProgress(p);
      if (p >= 1) {
        if (last) setAuto(false); else next();
      } else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [auto, i, step, last, next]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg pt-[var(--sat)] pb-[var(--sab)]" onClick={next} role="dialog" aria-label={`Chair-fly ${m.name}`}>
      <div className="flex items-center justify-between px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0">
          <p className="truncate text-sm text-muted">{m.name}</p>
          <p className="text-xs text-muted tabular">Step {i + 1} of {m.steps.length}</p>
        </div>
        <div className="flex items-center gap-1">
          {ttsSupported() && (
            <button className={`rounded-lg p-2 ${voice ? "text-amber" : "text-muted"}`} onClick={() => { unlockSpeech(); setVoice((v) => !v); }} aria-label="Toggle voice">
              <Icon name="mic" />
            </button>
          )}
          <button className={`rounded-lg p-2 ${auto ? "text-amber" : "text-muted"}`} onClick={() => setAuto((a) => !a)} aria-label="Toggle auto-advance">
            <Icon name={auto ? "pause" : "play"} />
          </button>
          <button className="rounded-lg p-2 text-muted" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>
      </div>

      <div className="h-1 w-full bg-surface-2">
        <div className="h-full bg-amber transition-[width] duration-100" style={{ width: `${((i + (auto ? progress : 0)) / m.steps.length) * 100}%` }} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="max-w-2xl text-2xl font-medium leading-snug sm:text-3xl">{step.action}</p>
        {step.callout && <p className="mt-6 text-xl text-amber sm:text-2xl">&ldquo;{step.callout}&rdquo;</p>}
        {step.target && <p className="mt-4 rounded-lg bg-surface-2 px-3 py-1.5 font-mono text-sm text-muted">{step.target}</p>}
      </div>

      <div className="flex items-center justify-between px-4 py-4 text-sm text-muted" onClick={(e) => e.stopPropagation()}>
        <button className="rounded-lg px-3 py-2 disabled:opacity-30" onClick={prev} disabled={i === 0}>← Back</button>
        <span className="text-xs">Tap or Space for next</span>
        {last ? (
          <button className="rounded-lg bg-amber px-3 py-2 font-medium text-bg" onClick={onClose}>Done</button>
        ) : (
          <button className="rounded-lg px-3 py-2" onClick={next}>Next →</button>
        )}
      </div>
    </div>
  );
}
