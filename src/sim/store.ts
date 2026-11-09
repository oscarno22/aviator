"use client";

import { useSyncExternalStore } from "react";
import { initialState, readout } from "./engine";
import type { SimSnapshot } from "./types";

/** Tiny external store so the whole panel re-renders at most 30 Hz. */
export function createSimStore(initial?: SimSnapshot) {
  let snap: SimSnapshot = initial ?? defaultSnapshot();
  const subs = new Set<() => void>();
  return {
    get: () => snap,
    set: (s: SimSnapshot) => { snap = s; subs.forEach((cb) => cb()); },
    subscribe: (cb: () => void) => { subs.add(cb); return () => { subs.delete(cb); }; },
  };
}
export type SimStore = ReturnType<typeof createSimStore>;

let serverSnap: SimSnapshot | null = null;
export function defaultSnapshot(): SimSnapshot {
  if (!serverSnap) {
    const { state, inputs } = initialState({ altFt: 3000, iasKt: 100, hdgDeg: 360 });
    serverSnap = { t: 0, state, readout: readout(state), inputs, paused: true };
  }
  return serverSnap;
}

export function useSimSnapshot(store: SimStore): SimSnapshot {
  return useSyncExternalStore(store.subscribe, store.get, defaultSnapshot);
}
