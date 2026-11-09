import type { ReactNode } from "react";
import { BEZEL, C, FACE, R } from "./gauge";

export default function Bezel({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-auto" role="img" aria-label={label}>
      <circle cx={C} cy={C} r={R + 3} fill={BEZEL} />
      <circle cx={C} cy={C} r={R} fill={FACE} stroke="#0a0f1a" strokeWidth={2} />
      {children}
    </svg>
  );
}
