"use client";

export default function Segmented<T extends string>({ value, options, onChange, className = "" }:
  { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={`inline-flex rounded-lg border border-border bg-surface-2 p-0.5 ${className}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={o.value === value} onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-sm transition ${o.value === value ? "bg-surface text-fg shadow" : "text-muted"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
