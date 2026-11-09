"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Dev chunks aren't content-hashed, so a cache-first worker would serve
    // stale code after every edit. Production only; clean up any leftover.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((reg) => reg.unregister()));
      return;
    }
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => console.error("sw registration failed", err));
    // Ask the browser not to evict localStorage (logbook, deck progress).
    // Safari otherwise clears site data after ~7 days without a visit.
    navigator.storage?.persist?.().catch(() => {});
  }, []);
  return null;
}
