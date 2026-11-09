import { memo } from "react";
import Bezel from "./Bezel";
import { AMBER, C, DIM, INK, NEEDLE, polar, r3, tick } from "./gauge";

/** 0 at 9 o'clock; +2000 and −2000 meet near 3 o'clock. */
const angle = (fpm: number) => -90 + (Math.max(-2000, Math.min(2000, fpm)) / 2000) * 170;

function VerticalSpeed({ vs }: { vs: number }) {
  const ticks = [];
  for (let v = -2000; v <= 2000; v += 100) {
    const major = v % 500 === 0;
    ticks.push(<path key={v} d={tick(angle(v), 88, major ? 10 : 5)} stroke={INK} strokeWidth={major ? 2 : 1} />);
    if (major) {
      const p = polar(68, angle(v));
      ticks.push(<text key={`t${v}`} x={p.x} y={p.y} fill={INK} fontSize={12} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-mono)">{Math.abs(v) / 100}</text>);
    }
  }
  return (
    <Bezel label={`Vertical speed ${vs.toFixed(0)} feet per minute`}>
      {ticks}
      <text x={C + 30} y={C - 22} fill={DIM} fontSize={9} textAnchor="middle">UP</text>
      <text x={C + 30} y={C + 28} fill={DIM} fontSize={9} textAnchor="middle">DOWN</text>
      <text x={C + 30} y={C + 4} fill={DIM} fontSize={7} textAnchor="middle">100 FT/MIN</text>
      <g transform={`rotate(${r3(angle(vs))} ${C} ${C})`}>
        <path d={`M ${C} ${C + 12} L ${C - 4} ${C} L ${C} ${C - 84} L ${C + 4} ${C} Z`} fill={NEEDLE} />
      </g>
      <circle cx={C} cy={C} r={5} fill={AMBER} />
    </Bezel>
  );
}
export default memo(VerticalSpeed);
