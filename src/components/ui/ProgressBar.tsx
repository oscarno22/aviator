export default function ProgressBar({ value, max, label, sublabel, color = "bg-sky" }:
  { value: number; max: number; label: string; sublabel?: string; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const done = value >= max;
  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className={done ? "text-ok" : ""}>{label}</span>
        <span className="tabular text-muted">{sublabel ?? `${value} / ${max}`}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${done ? "bg-ok" : color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
