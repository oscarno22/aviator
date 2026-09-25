"use client";

import { useCallback, useSyncExternalStore } from "react";
import { read, subscribe, write, type StoreKey } from "./storage";

/**
 * Hydration-safe localStorage hook. The server snapshot is the key's default,
 * so the first client render matches SSR; the real value arrives right after.
 */
export function useStored<T>(k: StoreKey<T>): [T, (next: T | ((prev: T) => T)) => void] {
  const sub = useCallback((cb: () => void) => subscribe(k.key, cb), [k.key]);
  const get = useCallback(() => read(k), [k]);
  const getServer = useCallback(() => k.default, [k]);
  const value = useSyncExternalStore(sub, get, getServer);
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(read(k)) : next;
      write(k, resolved);
    },
    [k]
  );
  return [value, set];
}

/** True once we're on the client after hydration (for client-only UI like voice buttons). */
export function useHydrated(): boolean {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}
