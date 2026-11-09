"use client";

import { useSyncExternalStore } from "react";
import type { SerialBridge } from "@/sim/io/serial";
import Button from "@/components/ui/Button";

export default function SerialConnect({ bridge, onConnected }: { bridge: SerialBridge; onConnected: () => void }) {
  const status = useSyncExternalStore(bridge.subscribe, bridge.getStatus, () => "not connected");
  const connect = async () => {
    try { await bridge.connect(); onConnected(); } catch { /* status already updated by the bridge */ }
  };
  const connected = status === "connected" || status.startsWith("hello");
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted">Hardware: {status}{bridge.malformed ? ` · ${bridge.malformed} bad lines` : ""}</span>
      {connected ? <Button className="h-7 px-2 text-xs" onClick={() => bridge.stop()}>Disconnect</Button> : <Button className="h-7 px-2 text-xs" onClick={connect}>Connect serial</Button>}
    </div>
  );
}
