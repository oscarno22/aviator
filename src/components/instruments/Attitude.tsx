import { memo, useId } from "react";
import Bezel from "./Bezel";
import { AMBER, C, INK, polar, r3 } from "./gauge";

const PX_PER_DEG = 3.2;
const SKY = "#3884e3", GROUND = "#8b5a2b";

function AttitudeIndicator({ pitch, bank }: { pitch: number; bank: number }) {
  const id = useId();
  const p = r3(Math.max(-40, Math.min(40, pitch)) * PX_PER_DEG);
  const ladder = [-20, -15, -10, -5, 5, 10, 15, 20];
  return (
    <Bezel label={`Attitude pitch ${pitch.toFixed(0)} bank ${bank.toFixed(0)}`}>
      <defs><clipPath id={id}><circle cx={C} cy={C} r={90} /></clipPath></defs>
      <g clipPath={`url(#${id})`}>
        <g transform={`rotate(${r3(-bank)} ${C} ${C})`}>
          <g transform={`translate(0 ${p})`}>
            <rect x={-200} y={-400} width={600} height={500} fill={SKY} />
            <rect x={-200} y={C} width={600} height={500} fill={GROUND} />
            <line x1={-200} y1={C} x2={400} y2={C} stroke={INK} strokeWidth={1.5} />
            {ladder.map((d) => {
              const w = d % 10 === 0 ? 24 : 14;
              const y = C - d * PX_PER_DEG;
              return (
                <g key={d}>
                  <line x1={C - w} y1={y} x2={C + w} y2={y} stroke={INK} strokeWidth={1.2} />
                  {d % 10 === 0 && <>
                    <text x={C - w - 4} y={y} fill={INK} fontSize={8} textAnchor="end" dominantBaseline="middle">{Math.abs(d)}</text>
                    <text x={C + w + 4} y={y} fill={INK} fontSize={8} dominantBaseline="middle">{Math.abs(d)}</text>
                  </>}
                </g>
              );
            })}
          </g>
          {/* bank scale rotates with the horizon */}
          {[-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60].map((a) => {
            const len = a === 0 ? 10 : Math.abs(a) % 30 === 0 ? 9 : 5;
            const o = polar(88, a), i = polar(88 - len, a);
            return <line key={a} x1={o.x} y1={o.y} x2={i.x} y2={i.y} stroke={INK} strokeWidth={a === 0 ? 3 : 1.5} />;
          })}
        </g>
      </g>
      {/* fixed bank pointer and miniature airplane */}
      <path d={`M ${C} ${C - 78} l -5 8 h 10 z`} fill={AMBER} />
      <path d={`M ${C - 34} ${C} h 22 l 6 6 l 6 -6 h 22`} stroke={AMBER} strokeWidth={3} fill="none" strokeLinecap="round" />
      <circle cx={C} cy={C} r={2.5} fill={AMBER} />
    </Bezel>
  );
}
export default memo(AttitudeIndicator);
