import { memo } from "react";
import Bezel from "./Bezel";
import { AMBER, C, DIM, INK, NEEDLE, arcPath, polar, r3, tick } from "./gauge";

const angle = (rpm: number) => -135 + (Math.max(0, Math.min(3500, rpm)) / 3500) * 270;

function Tachometer({ rpm, hobbs }: { rpm: number; hobbs: number }) {
  const ticks = [];
  for (let r = 0; r <= 3500; r += 100) {
    const major = r % 500 === 0;
    ticks.push(<path key={r} d={tick(angle(r), 88, major ? 10 : 5)} stroke={INK} strokeWidth={major ? 2 : 1} />);
    if (major) {
      const p = polar(70, angle(r));
      ticks.push(<text key={`t${r}`} x={p.x} y={p.y} fill={INK} fontSize={11} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-mono)">{r / 100}</text>);
    }
  }
  return (
    <Bezel label={`Tachometer ${rpm.toFixed(0)} rpm`}>
      <path d={arcPath(90, angle(2100), angle(2700))} stroke="#34d399" strokeWidth={4} fill="none" />
      <path d={tick(angle(2700), 94, 14)} stroke="#f87171" strokeWidth={3} />
      {ticks}
      <text x={C} y={60} fill={DIM} fontSize={9} textAnchor="middle" letterSpacing={1}>RPM</text>
      <text x={C} y={72} fill={DIM} fontSize={7} textAnchor="middle">×100</text>
      <rect x={C - 24} y={132} width={48} height={14} fill="#050810" stroke={DIM} strokeWidth={0.8} />
      <text x={C} y={140} fill={INK} fontSize={9} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-mono)">{hobbs.toFixed(1).padStart(6, "0")}</text>
      <g transform={`rotate(${r3(angle(rpm))} ${C} ${C})`}>
        <path d={`M ${C} ${C + 12} L ${C - 4} ${C} L ${C} ${C - 80} L ${C + 4} ${C} Z`} fill={NEEDLE} />
      </g>
      <circle cx={C} cy={C} r={5} fill={AMBER} />
    </Bezel>
  );
}
export default memo(Tachometer);
