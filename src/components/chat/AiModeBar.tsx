"use client";

import Link from "next/link";
import type { AiMode } from "@/lib/aiStatus";

/** One line saying which engine is answering, with the way to switch. */
export default function AiModeBar({ ai, what }: { ai: AiMode; what: string }) {
  if (ai.mode === "ai") {
    return (
      <p className="mb-3 flex items-center justify-between gap-2 text-xs text-muted">
        <span>Answered by Claude.</span>
        <button className="underline hover:text-fg" onClick={() => ai.goScripted("manual")}>Use the {what} instead</button>
      </p>
    );
  }
  return (
    <p className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs text-silver">
      <span><span className="font-semibold capitalize">{what}</span> · Claude is not in use ({ai.reason}).</span>
      {ai.canRetry
        ? <button className="font-medium text-accent hover:underline" onClick={ai.tryClaude}>Try Claude</button>
        : <Link href="/settings" className="font-medium text-accent hover:underline">Settings</Link>}
    </p>
  );
}
