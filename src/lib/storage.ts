/**
 * Versioned localStorage with in-tab + cross-tab subscriptions.
 * Every value is stored as {v, data}. Reads outside the browser return the default.
 */
const PREFIX = "aviator:";

export interface StoreKey<T> {
  key: string;
  version: number;
  default: T;
  migrate?: (old: unknown, fromVersion: number) => T;
}

export function defineKey<T>(key: string, version: number, def: T, migrate?: StoreKey<T>["migrate"]): StoreKey<T> {
  return { key: PREFIX + key, version, default: def, migrate };
}

type Envelope = { v: number; data: unknown };

const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function hasStorage() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function parse<T>(k: StoreKey<T>, raw: string | null): T {
  if (raw == null) return k.default;
  try {
    const env = JSON.parse(raw) as Envelope;
    if (env && typeof env === "object" && "v" in env) {
      if (env.v === k.version) return env.data as T;
      if (k.migrate) return k.migrate(env.data, env.v);
      return k.default;
    }
    return k.default;
  } catch {
    return k.default;
  }
}

/** Referentially stable while the underlying raw string is unchanged. */
export function read<T>(k: StoreKey<T>): T {
  if (!hasStorage()) return k.default;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(k.key);
  } catch {
    return k.default;
  }
  const c = cache.get(k.key);
  if (c && c.raw === raw) return c.value as T;
  const value = parse(k, raw);
  cache.set(k.key, { raw, value });
  return value;
}

function notify(key: string) {
  listeners.get(key)?.forEach((cb) => cb());
  listeners.get("*")?.forEach((cb) => cb());
}

export function write<T>(k: StoreKey<T>, data: T): void {
  if (!hasStorage()) return;
  const raw = JSON.stringify({ v: k.version, data } satisfies Envelope);
  try {
    window.localStorage.setItem(k.key, raw);
  } catch (err) {
    console.warn("storage write failed", err);
  }
  cache.set(k.key, { raw, value: data });
  notify(k.key);
}

export function update<T>(k: StoreKey<T>, fn: (prev: T) => T): T {
  const next = fn(read(k));
  write(k, next);
  return next;
}

export function remove<T>(k: StoreKey<T>): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(k.key);
  } catch {}
  cache.delete(k.key);
  notify(k.key);
}

/** Subscribe to one key, or "*" for any key. Returns unsubscribe. */
export function subscribe(key: string, cb: () => void): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(cb);
  return () => listeners.get(key)?.delete(cb);
}

// Cross-tab: forward storage events to subscribers.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key && e.key.startsWith(PREFIX)) notify(e.key);
  });
}

/** Export every aviator key as one JSON object (raw envelopes). */
export function exportAll(): Record<string, Envelope> {
  const out: Record<string, Envelope> = {};
  if (!hasStorage()) return out;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(PREFIX)) continue;
    try {
      out[key.slice(PREFIX.length)] = JSON.parse(window.localStorage.getItem(key) ?? "null");
    } catch {}
  }
  return out;
}

/** Import an object produced by exportAll. Replaces matching keys. */
export function importAll(data: Record<string, Envelope>): number {
  if (!hasStorage()) return 0;
  let n = 0;
  for (const [short, env] of Object.entries(data)) {
    if (!env || typeof env !== "object" || !("v" in env) || !("data" in env)) continue;
    const key = PREFIX + short;
    window.localStorage.setItem(key, JSON.stringify(env));
    cache.delete(key);
    notify(key);
    n++;
  }
  return n;
}

export function clearAll(): void {
  if (!hasStorage()) return;
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(PREFIX)) keys.push(key);
  }
  keys.forEach((k) => {
    window.localStorage.removeItem(k);
    cache.delete(k);
    notify(k);
  });
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
