"use client";

import Button from "@/components/ui/Button";

export interface ChatOption {
  id: string;
  label: string;
  summary: string;
  briefing: string[];       // shown in the drawer
  frequency?: string;       // radio: "Concord Ground 121.85"
  opensWith?: "pilot" | "atc";
}

/** Scenario or topic picker with a collapsible briefing and the Start button. */
export default function OptionPicker({ options, selected, onSelect, showBrief, onToggleBrief, onStart, started, disabled }:
  { options: ChatOption[]; selected: string | null; onSelect: (id: string | null) => void; showBrief: boolean; onToggleBrief: () => void; onStart: () => void; started: boolean; disabled?: boolean }) {
  const option = options.find((o) => o.id === selected) ?? null;
  return (
    <div className="mb-3 rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2 p-2">
        <select className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm" value={selected ?? ""} onChange={(e) => onSelect(e.target.value || null)} aria-label="Scenario">
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <Button variant="ghost" className="h-9 px-2 text-xs" onClick={onToggleBrief} aria-expanded={showBrief}>{showBrief ? "Hide" : "Brief"}</Button>
        <Button variant="primary" className="h-9" onClick={onStart} disabled={disabled}>{started ? "Restart" : "Start"}</Button>
      </div>
      {showBrief && option && (
        <div className="border-t border-border p-3 text-sm">
          {option.frequency && <p className="mb-1 font-mono text-xs text-accent">{option.frequency}</p>}
          <p className="text-fg/90">{option.summary}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted">{option.briefing.map((b) => <li key={b}>{b}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
