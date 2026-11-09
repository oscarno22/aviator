import { memo } from "react";
import Bezel from "./Bezel";
import { AMBER, C, DIM, INK, NEEDLE, arcPath, polar, r3, tick } from "./gauge";
import { AIRSPEED_ARCS } from "@/data/c172";

const MAX = AIRSPEED_ARCS.max;
const A0 = -150, A1 = 150;
const angle = (kt: number) => A0 + (Math.max(0, Math.min(MAX, kt)) / MAX) * (A1 - A0);

function AirspeedIndicator({ ias }: { ias: number }) {
  const ticks = [];
  for (let kt = 0; kt <= MAX; kt += 10) {
    const major = kt % 20 === 0;
    ticks.push(<path key={kt} d={tick(angle(kt), 88, major ? 10 : 6)} stroke={INK} strokeWidth={major ? 2 : 1.2} />);
    if (kt % 40 === 0 && kt > 0) {
      const p = polar(68, angle(kt));
      ticks.push(<text key={`t${kt}`} x={p.x} y={p.y} fill={INK} fontSize={13} textAnchor="middle" dominantBaseline="middle" fontFamily="var(--font-mono)">{kt}</text>);
    }
  }
  return (
    <Bezel label={`Airspeed ${ias.toFixed(0)} knots`}>
      <path d={arcPath(92, angle(AIRSPEED_ARCS.white.from), angle(AIRSPEED_ARCS.white.to))} stroke="#ffffff" strokeWidth={4} fill="none" />
      <path d={arcPath(87, angle(AIRSPEED_ARCS.green.from), angle(AIRSPEED_ARCS.green.to))} stroke="#34d399" strokeWidth={4} fill="none" />
      <path d={arcPath(87, angle(AIRSPEED_ARCS.yellow.from), angle(AIRSPEED_ARCS.yellow.to))} stroke="#fbbf24" strokeWidth={4} fill="none" />
      <path d={tick(angle(AIRSPEED_ARCS.redline), 92, 12)} stroke="#f87171" strokeWidth={3} />
      {ticks}
      <text x={C} y={58} fill={DIM} fontSize={9} textAnchor="middle" letterSpacing={1}>AIRSPEED</text>
      <text x={C} y={140} fill={DIM} fontSize={9} textAnchor="middle">KNOTS</text>
      <g transform={`rotate(${r3(angle(ias))} ${C} ${C})`}>
        <path d={`M ${C} ${C + 14} L ${C - 4} ${C} L ${C} ${C - 82} L ${C + 4} ${C} Z`} fill={NEEDLE} />
      </g>
      <circle cx={C} cy={C} r={5} fill={AMBER} />
    </Bezel>
  );
}
export default memo(AirspeedIndicator);
