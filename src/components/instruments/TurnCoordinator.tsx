import { memo } from "react";
import Bezel from "./Bezel";
import { AMBER, C, DIM, INK, NEEDLE, polar, r3 } from "./gauge";

/** Miniature airplane tilts with rate of turn (and a bit of roll rate); the ball shows coordination. */
function TurnCoordinator({ turnRate, rollRate, ball }: { turnRate: number; rollRate: number; ball: number }) {
  const tilt = r3(Math.max(-45, Math.min(45, (turnRate / 3) * 20 + rollRate * 0.12)));
  const bx = r3(C + Math.max(-1, Math.min(1, ball)) * 24);
  const by = r3(150 - (Math.abs(ball) * 24) ** 2 / 260); // slight curve of the tube
  return (
    <Bezel label={`Turn coordinator ${turnRate.toFixed(1)} deg per second`}>
      {/* L and R standard-rate indices at ±20° below horizontal */}
      {[[-1, "L"], [1, "R"]].map(([s, l]) => {
        const sign = s as number;
        const ang = 90 + sign * 70; // 20° below horizontal each side
        const o = polar(86, ang), i = polar(76, ang);
        const t = polar(66, ang);
        return (
          <g key={l as string}>
            <line x1={o.x} y1={o.y} x2={i.x} y2={i.y} stroke={INK} strokeWidth={3} />
            <text x={t.x} y={t.y} fill={INK} fontSize={10} textAnchor="middle" dominantBaseline="middle">{l as string}</text>
          </g>
        );
      })}
      {[-90, 90].map((a) => { const o = polar(86, a), i = polar(76, a); return <line key={a} x1={o.x} y1={o.y} x2={i.x} y2={i.y} stroke={INK} strokeWidth={3} />; })}
      <text x={C} y={54} fill={DIM} fontSize={8} textAnchor="middle">TURN COORDINATOR</text>
      <text x={C} y={126} fill={DIM} fontSize={7} textAnchor="middle">2 MIN</text>
      <g transform={`rotate(${tilt} ${C} ${C})`}>
        <path d={`M ${C - 42} ${C} h 84`} stroke={NEEDLE} strokeWidth={4} strokeLinecap="round" />
        <path d={`M ${C} ${C - 10} v 20 M ${C - 10} ${C + 6} h 20`} stroke={NEEDLE} strokeWidth={4} strokeLinecap="round" />
        <circle cx={C} cy={C} r={6} fill={NEEDLE} />
      </g>
      {/* inclinometer */}
      <path d={`M ${C - 36} 146 Q ${C} 158 ${C + 36} 146`} stroke={DIM} strokeWidth={12} fill="none" strokeLinecap="round" />
      <path d={`M ${C - 36} 146 Q ${C} 158 ${C + 36} 146`} stroke="#050810" strokeWidth={9} fill="none" strokeLinecap="round" />
      <line x1={C - 7} y1={143} x2={C - 7} y2={158} stroke={INK} strokeWidth={1.2} />
      <line x1={C + 7} y1={143} x2={C + 7} y2={158} stroke={INK} strokeWidth={1.2} />
      <circle cx={bx} cy={by} r={4.5} fill={AMBER} />
    </Bezel>
  );
}
export default memo(TurnCoordinator);
