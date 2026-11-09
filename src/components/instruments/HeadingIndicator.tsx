import { memo } from "react";
import Bezel from "./Bezel";
import { AMBER, C, DIM, INK, polar, r3, tick } from "./gauge";

const LABELS: Record<number, string> = { 0: "N", 90: "E", 180: "S", 270: "W" };

function HeadingIndicator({ hdg }: { hdg: number }) {
  const ticks = [];
  for (let d = 0; d < 360; d += 5) {
    const major = d % 10 === 0;
    ticks.push(<path key={d} d={tick(d, 88, major ? 9 : 5)} stroke={INK} strokeWidth={major ? 1.6 : 1} />);
    if (d % 30 === 0) {
      const p = polar(68, d);
      ticks.push(<text key={`t${d}`} x={p.x} y={p.y} fill={LABELS[d] ? AMBER : INK} fontSize={LABELS[d] ? 15 : 12} fontWeight={LABELS[d] ? 700 : 400} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${d} ${p.x} ${p.y})`} fontFamily="var(--font-mono)">{LABELS[d] ?? d / 10}</text>);
    }
  }
  return (
    <Bezel label={`Heading ${hdg.toFixed(0)}`}>
      <g transform={`rotate(${r3(-hdg)} ${C} ${C})`}>{ticks}</g>
      {/* fixed airplane and lubber line */}
      <path d={`M ${C} ${C - 96} l -5 10 h 10 z`} fill={AMBER} />
      <path d={`M ${C} ${C - 24} v 44 M ${C - 26} ${C - 2} h 52 M ${C - 10} ${C + 16} h 20`} stroke={INK} strokeWidth={3} strokeLinecap="round" opacity={0.9} />
      {[45, 135, 225, 315].map((a) => { const o = polar(96, a), i = polar(90, a); return <line key={a} x1={o.x} y1={o.y} x2={i.x} y2={i.y} stroke={DIM} strokeWidth={2} />; })}
    </Bezel>
  );
}
export default memo(HeadingIndicator);
