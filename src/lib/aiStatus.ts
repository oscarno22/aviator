"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { AiFailKind } from "./chat-types";
import { settingsKey } from "./settings";
import { defineKey, write } from "./storage";
import { useHydrated, useStored } from "./useStored";

/**
 * Remembers whether Claude answered last time, so Radio and Oral can open
 * straight into the scripted drills instead of repeating a failed round trip.
 */
export interface AiStatus {
  state: "unknown" | "ok" | "down";
  reason?: AiFailKind | "manual";
  at?: string; // ISO time of the last change
}

export const aiStatusKey = defineKey<AiStatus>("ai-status", 1, { state: "unknown" });

export const DOWN_TTL_MS = 24 * 60 * 60 * 1000;

/** Failures that mean "Claude is not going to answer for a while". */
const DOWN_KINDS: AiFailKind[] = ["offline", "billing", "config", "auth", "upstream"];

/** Should this failure flip the app into scripted mode? A stream that died before any text counts. */
export function isDownFailure(kind: AiFailKind, gotText: boolean): boolean {
  if (kind === "stream") return !gotText;
  return DOWN_KINDS.includes(kind);
}

export function afterFailure(prev: AiStatus, kind: AiFailKind, gotText: boolean, now = new Date()): AiStatus {
  return isDownFailure(kind, gotText) ? { state: "down", reason: kind, at: now.toISOString() } : prev;
}

export function isDown(s: AiStatus, now = new Date()): boolean {
  if (s.state !== "down" || !s.at) return false;
  return now.getTime() - new Date(s.at).getTime() < DOWN_TTL_MS;
}

export const REASON_TEXT: Record<AiFailKind | "off" | "no-passcode" | "manual", string> = {
  manual: "you switched to the drill",
  off: "turned off in Settings",
  "no-passcode": "no passcode set",
  offline: "you are offline",
  billing: "no API credit",
  config: "server not set up",
  auth: "API key rejected",
  upstream: "the API is not answering",
  stream: "the reply was cut off",
  rate: "rate limited",
  passcode: "passcode rejected",
  "bad-request": "request rejected",
};

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
}

export interface AiMode {
  /** "ai": talk to Claude. "scripted": use the built-in drills. */
  mode: "ai" | "scripted";
  /** Why scripted, in words; undefined in AI mode. */
  reason?: string;
  /** False when the user has to change something first (Settings toggle, passcode, connection). */
  canRetry: boolean;
  noteFailure: (kind: AiFailKind, gotText: boolean) => void;
  noteOk: () => void;
  goScripted: (kind?: AiFailKind | "manual") => void;
  tryClaude: () => void;
}

export function useAiMode(): AiMode {
  const hydrated = useHydrated();
  const [settings] = useStored(settingsKey);
  const [status, setStatus] = useStored(aiStatusKey);
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

  const noteFailure = useCallback((kind: AiFailKind, gotText: boolean) => setStatus((p) => afterFailure(p, kind, gotText)), [setStatus]);
  const noteOk = useCallback(() => setStatus((p) => (p.state === "ok" ? p : { state: "ok", at: new Date().toISOString() })), [setStatus]);
  const goScripted = useCallback((kind: AiFailKind | "manual" = "manual") => write(aiStatusKey, { state: "down", reason: kind, at: new Date().toISOString() }), []);
  const tryClaude = useCallback(() => write(aiStatusKey, { state: "unknown" }), []);
  const fns = { noteFailure, noteOk, goScripted, tryClaude };

  // Before hydration we cannot know; render AI mode so the server and first client render agree.
  if (!hydrated) return { mode: "ai", canRetry: false, ...fns };
  if (settings.aiMode === "off") return { mode: "scripted", reason: REASON_TEXT.off, canRetry: false, ...fns };
  if (!online) return { mode: "scripted", reason: REASON_TEXT.offline, canRetry: false, ...fns };
  if (!settings.passcode) return { mode: "scripted", reason: REASON_TEXT["no-passcode"], canRetry: false, ...fns };
  if (isDown(status)) return { mode: "scripted", reason: REASON_TEXT[status.reason ?? "upstream"], canRetry: true, ...fns };
  return { mode: "ai", canRetry: false, ...fns };
}
