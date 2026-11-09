"use client";

import { TASKS, type PracticeTask } from "@/sim/tasks";
import Icon from "@/components/Icon";

export default function TaskPicker({ onPick, current }: { onPick: (t: PracticeTask | null) => void; current: PracticeTask | null }) {
  return (
    <ul className="divide-y divide-border">
      <li>
        <button className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-surface-2 ${!current ? "text-amber" : ""}`} onClick={() => onPick(null)}>
          <span>Free flight</span><Icon name="chevron" size={14} className="text-muted" />
        </button>
      </li>
      {TASKS.map((t) => (
        <li key={t.id}>
          <button className={`flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-surface-2 ${current?.id === t.id ? "text-amber" : ""}`} onClick={() => onPick(t)}>
            <span>
              <span className="block text-sm">{t.title}</span>
              <span className="block text-[11px] text-muted">{t.acsRef}</span>
            </span>
            <Icon name="chevron" size={14} className="text-muted" />
          </button>
        </li>
      ))}
    </ul>
  );
}
