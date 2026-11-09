import { memo } from "react";
import Bezel from "./Bezel";
import { AMBER, C, DIM, INK, NEEDLE, polar, r3, tick } from "./gauge";

function Altimeter({ alt }: { alt: number }) {
  const a = Math.max(0, alt);
  const hundreds = r3(((a % 1000) / 1000) * 360);
  const thousands = r3(((a % 10000) / 10000) * 360);
  const tenThousands = r3(((a % 100000) / 100000) * 360);
  const ticks = [];
  for (let i = 0; i < 50; i++) {
    const deg = i * 7.2;
    const major = i % 5 === 0;
    ticks.push(<path key={i} d={tick(deg, 88, major ? 10 : 5)} stroke={INK} strokeWidth={major ? 2 : 1} />);
    if (major) {
      const p = polar(70, deg);
      ticks.push(<text key={`t${i}`} x={p.x} y={p.y} fill={INK} fontSize={14} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-mono)">{i / 5}</text>);
    }
  }
  return (
    <Bezel label={`Altimeter ${alt.toFixed(0)} feet`}>
      {ticks}
      <text x={C} y={52} fill={DIM} fontSize={9} textAnchor="middle" letterSpacing={1}>ALT</text>
      <rect x={C + 28} y={C - 8} width={36} height={16} fill="#050810" stroke={DIM} strokeWidth={0.8} />
      <text x={C + 46} y={C + 1} fill={INK} fontSize={9} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-mono)">29.92</text>
      <text x={C} y={146} fill={DIM} fontSize={8} textAnchor="middle">100 FEET PER DIV</text>
      <g transform={`rotate(${tenThousands} ${C} ${C})`}>
        <path d={`M ${C - 1.5} ${C} L ${C} ${C - 84} L ${C + 1.5} ${C} Z`} fill={DIM} />
        <path d={`M ${C - 5} ${C - 84} h 10 l -5 8 z`} fill={DIM} />
      </g>
      <g transform={`rotate(${thousands} ${C} ${C})`}>
        <path d={`M ${C} ${C + 10} L ${C - 6} ${C - 10} L ${C} ${C - 52} L ${C + 6} ${C - 10} Z`} fill={NEEDLE} />
      </g>
      <g transform={`rotate(${hundreds} ${C} ${C})`}>
        <path d={`M ${C} ${C + 14} L ${C - 3.5} ${C} L ${C} ${C - 84} L ${C + 3.5} ${C} Z`} fill={NEEDLE} />
      </g>
      <circle cx={C} cy={C} r={4.5} fill={AMBER} />
    </Bezel>
  );
}
export default memo(Altimeter);
