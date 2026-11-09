import { memo } from "react";
import { AMBER, DIM, FACE, INK, r3 } from "./gauge";

function FlapIndicator({ flaps, selected }: { flaps: number; selected: number }) {
  const y = (deg: number) => r3(22 + (deg / 30) * 100);
  return (
    <svg viewBox="0 0 90 150" className="h-full w-auto" role="img" aria-label={`Flaps ${flaps.toFixed(0)} degrees`}>
      <rect x={4} y={4} width={82} height={142} rx={10} fill={FACE} stroke="#2a3548" strokeWidth={3} />
      <text x={45} y={16} fill={DIM} fontSize={8} textAnchor="middle" letterSpacing={1}>FLAPS</text>
      {[0, 10, 20, 30].map((d) => (
        <g key={d}>
          <line x1={34} y1={y(d)} x2={46} y2={y(d)} stroke={INK} strokeWidth={2} />
          <text x={58} y={y(d)} fill={selected === d ? AMBER : INK} fontSize={11} dominantBaseline="middle" fontFamily="var(--font-mono)">{d}°</text>
        </g>
      ))}
      <line x1={40} y1={y(0)} x2={40} y2={y(30)} stroke={DIM} strokeWidth={1} />
      <path d={`M 22 ${y(flaps)} l 10 -5 v 10 z`} fill={AMBER} />
    </svg>
  );
}
export default memo(FlapIndicator);
