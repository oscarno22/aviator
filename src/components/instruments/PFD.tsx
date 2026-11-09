import { memo, useId } from "react";
import type { InstrumentReadout } from "@/sim/types";
import { AIRSPEED_ARCS, C172 } from "@/data/c172";
import { r3 } from "./gauge";

/**
 * Simplified G1000-style primary flight display: attitude behind airspeed and
 * altitude tapes, VSI, slip indicator, and a heading rose with a turn-rate bar.
 */
const W = 600, H = 400, CX = 300, CY = 190;
const PX_PER_DEG = 5;
const SKY = "#2f7fd8", GROUND = "#8a5a2b", CYAN = "#67e8f9", MAGENTA = "#e879f9", WHITE = "#f5f7fa", BOX = "#0a0f1a";
const BUGS: { kt: number; label: string }[] = [
  { kt: C172.vSpeeds.Vr.kt, label: "R" }, { kt: C172.vSpeeds.Vx.kt, label: "X" }, { kt: C172.vSpeeds.Vy.kt, label: "Y" }, { kt: C172.vSpeeds.Vglide.kt, label: "G" },
];

function PFD({ r }: { r: InstrumentReadout }) {
  const id = useId();
  const bank = r3(-r.bank);
  const pitchPx = r3(Math.max(-30, Math.min(30, r.pitch)) * PX_PER_DEG);
  const ias = Math.max(20, r.ias);
  const tapeKt = (kt: number) => r3(CY - (kt - ias) * 3.2);            // 3.2 px per kt
  const tapeFt = (ft: number) => r3(CY - (ft - r.alt) * 0.35);         // 0.35 px per ft
  const vsY = r3(CY - Math.max(-2000, Math.min(2000, r.vs)) * 0.06);
  const slip = r3(Math.max(-1, Math.min(1, r.ball)) * 18);
  const turnBar = r3(Math.max(-60, Math.min(60, r.turnRate * 6)));     // heading change in 6 s, ~1 px/deg
  const hdgTicks: React.ReactNode[] = [];
  for (let d = 0; d < 360; d += 5) {
    const rel = ((d - r.hdg + 540) % 360) - 180;
    if (Math.abs(rel) > 45) continue;
    const x = r3(CX + rel * 3.2);
    const major = d % 10 === 0;
    hdgTicks.push(<line key={d} x1={x} y1={350} x2={x} y2={major ? 362 : 356} stroke={WHITE} strokeWidth={1.5} />);
    if (d % 30 === 0) {
      const label = d === 0 ? "N" : d === 90 ? "E" : d === 180 ? "S" : d === 270 ? "W" : String(d / 10);
      hdgTicks.push(<text key={`t${d}`} x={x} y={376} fill={WHITE} fontSize={12} textAnchor="middle" fontFamily="var(--font-mono)">{label}</text>);
    }
  }
  const ladder: React.ReactNode[] = [];
  for (let d = -30; d <= 30; d += 5) {
    if (d === 0) continue;
    const y = r3(CY - d * PX_PER_DEG);
    const w = d % 10 === 0 ? 40 : 20;
    ladder.push(<line key={d} x1={CX - w} y1={y} x2={CX + w} y2={y} stroke={WHITE} strokeWidth={1.5} />);
    if (d % 10 === 0) ladder.push(<text key={`l${d}`} x={CX - w - 6} y={y + 4} fill={WHITE} fontSize={11} textAnchor="end" fontFamily="var(--font-mono)">{Math.abs(d)}</text>, <text key={`r${d}`} x={CX + w + 6} y={y + 4} fill={WHITE} fontSize={11} fontFamily="var(--font-mono)">{Math.abs(d)}</text>);
  }
  const arcColor = (kt: number) => kt >= AIRSPEED_ARCS.redline ? "#f87171" : kt >= AIRSPEED_ARCS.yellow.from ? "#fbbf24" : kt >= AIRSPEED_ARCS.green.from ? "#34d399" : kt >= AIRSPEED_ARCS.white.from ? "#ffffff" : "#f87171";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-xl" role="img" aria-label={`Primary flight display: ${r.ias.toFixed(0)} knots, ${r.alt.toFixed(0)} feet, heading ${r.hdg.toFixed(0)}`}>
      <defs>
        <clipPath id={`${id}-att`}><rect x={0} y={0} width={W} height={340} /></clipPath>
        <clipPath id={`${id}-tape`}><rect x={0} y={40} width={W} height={300} /></clipPath>
        <clipPath id={`${id}-hdg`}><rect x={150} y={342} width={300} height={58} /></clipPath>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill={BOX} />
      {/* attitude */}
      <g clipPath={`url(#${id}-att)`}>
        <g transform={`rotate(${bank} ${CX} ${CY})`}>
          <g transform={`translate(0 ${pitchPx})`}>
            <rect x={-600} y={-800} width={1800} height={800 + CY} fill={SKY} />
            <rect x={-600} y={CY} width={1800} height={1000} fill={GROUND} />
            <line x1={-600} y1={CY} x2={1200} y2={CY} stroke={WHITE} strokeWidth={2} />
            {ladder}
          </g>
          {/* roll pointer moves with the airplane */}
          <path d={`M ${CX} ${CY - 128} l -8 14 h 16 z`} fill={WHITE} />
          <rect x={CX - 8 + slip} y={CY - 112} width={16} height={5} fill={WHITE} />
        </g>
        {/* fixed roll scale */}
        {[-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60].map((a) => {
          const rad = ((a - 90) * Math.PI) / 180, len = a === 0 ? 14 : Math.abs(a) % 30 === 0 ? 12 : 7;
          const x1 = r3(CX + 132 * Math.cos(rad)), y1 = r3(CY + 132 * Math.sin(rad)), x2 = r3(CX + (132 + len) * Math.cos(rad)), y2 = r3(CY + (132 + len) * Math.sin(rad));
          return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke={WHITE} strokeWidth={a === 0 ? 3 : 2} />;
        })}
        {/* aircraft symbol */}
        <path d={`M ${CX - 70} ${CY} h 40 v 10 h -8 M ${CX + 70} ${CY} h -40 v 10 h 8`} stroke="#facc15" strokeWidth={4} fill="none" strokeLinecap="round" />
        <rect x={CX - 3} y={CY - 3} width={6} height={6} fill="#facc15" />
      </g>

      {/* airspeed tape */}
      <g clipPath={`url(#${id}-tape)`}>
        <rect x={30} y={40} width={90} height={300} fill="rgba(10,15,26,0.75)" />
        {Array.from({ length: 21 }, (_, i) => Math.round((ias - 50) / 10) * 10 + i * 10).filter((kt) => kt >= 0).map((kt) => {
          const y = tapeKt(kt);
          return (
            <g key={kt}>
              <line x1={104} y1={y} x2={118} y2={y} stroke={WHITE} strokeWidth={1.5} />
              {kt % 20 === 0 && <text x={98} y={y + 5} fill={WHITE} fontSize={14} textAnchor="end" fontFamily="var(--font-mono)">{kt}</text>}
              <rect x={118} y={tapeKt(kt + 10)} width={4} height={r3(y - tapeKt(kt + 10))} fill={arcColor(kt)} />
            </g>
          );
        })}
        {BUGS.map((b) => (
          <g key={b.label} transform={`translate(122 ${tapeKt(b.kt)})`}>
            <path d="M 0 0 l 6 -5 h 10 v 10 h -10 z" fill={CYAN} />
            <text x={7} y={4} fill={BOX} fontSize={9} fontWeight={700} fontFamily="var(--font-mono)">{b.label}</text>
          </g>
        ))}
      </g>
      <path d={`M 34 ${CY - 16} h 76 l 10 16 l -10 16 h -76 z`} fill={BOX} stroke={WHITE} strokeWidth={1.5} />
      <text x={100} y={CY + 7} fill={WHITE} fontSize={22} fontWeight={700} textAnchor="end" fontFamily="var(--font-mono)">{Math.round(r.ias)}</text>
      <text x={34} y={56} fill={WHITE} fontSize={10} opacity={0.8}>KT</text>
      <text x={34} y={330} fill={CYAN} fontSize={10}>TAS {Math.round(r.tas)}</text>

      {/* altitude tape */}
      <g clipPath={`url(#${id}-tape)`}>
        <rect x={470} y={40} width={90} height={300} fill="rgba(10,15,26,0.75)" />
        {Array.from({ length: 17 }, (_, i) => Math.round(r.alt / 100) * 100 - 800 + i * 100).map((ft) => {
          const y = tapeFt(ft);
          return (
            <g key={ft}>
              <line x1={470} y1={y} x2={482} y2={y} stroke={WHITE} strokeWidth={1.5} />
              {ft % 200 === 0 && <text x={488} y={y + 5} fill={WHITE} fontSize={13} fontFamily="var(--font-mono)">{ft}</text>}
            </g>
          );
        })}
      </g>
      <path d={`M 566 ${CY - 16} h -80 l -10 16 l 10 16 h 80 z`} fill={BOX} stroke={WHITE} strokeWidth={1.5} />
      <text x={560} y={CY + 7} fill={WHITE} fontSize={22} fontWeight={700} textAnchor="end" fontFamily="var(--font-mono)">{Math.round(r.alt / 20) * 20}</text>
      <text x={488} y={56} fill={WHITE} fontSize={10} opacity={0.8}>FT</text>
      <text x={488} y={330} fill={CYAN} fontSize={10}>29.92 IN</text>

      {/* VSI */}
      <rect x={566} y={70} width={28} height={240} fill="rgba(10,15,26,0.75)" />
      {[-2000, -1000, 0, 1000, 2000].map((v) => { const y = r3(CY - v * 0.06); return <g key={v}><line x1={566} y1={y} x2={572} y2={y} stroke={WHITE} /><text x={575} y={y + 4} fill={WHITE} fontSize={9} fontFamily="var(--font-mono)">{Math.abs(v) / 1000 || 0}</text></g>; })}
      <path d={`M 566 ${vsY} l 8 -5 v 10 z`} fill={WHITE} />
      <text x={594} y={vsY < CY ? vsY + 20 : vsY - 10} fill={WHITE} fontSize={10} textAnchor="end" fontFamily="var(--font-mono)">{Math.round(r.vs / 50) * 50}</text>

      {/* heading rose */}
      <g clipPath={`url(#${id}-hdg)`}>
        <rect x={150} y={342} width={300} height={58} fill="rgba(10,15,26,0.9)" />
        {hdgTicks}
        <rect x={CX} y={344} width={turnBar} height={4} fill={MAGENTA} transform={turnBar < 0 ? `translate(${turnBar} 0)` : undefined} />
        {[-18, 18].map((x) => <line key={x} x1={CX + x} y1={342} x2={CX + x} y2={349} stroke={WHITE} strokeWidth={1.5} />)}
      </g>
      <path d={`M ${CX} 350 l -6 -9 h 12 z`} fill={WHITE} />
      <rect x={CX - 26} y={318} width={52} height={22} fill={BOX} stroke={WHITE} strokeWidth={1.5} />
      <text x={CX} y={334} fill={WHITE} fontSize={15} fontWeight={700} textAnchor="middle" fontFamily="var(--font-mono)">{String(Math.round(r.hdg) % 360 || 360).padStart(3, "0")}°</text>
      <text x={470} y={336} fill={CYAN} fontSize={10}>TRK</text>
      <text x={150} y={336} fill={WHITE} fontSize={10} opacity={0.8}>{Math.abs(r.turnRate) >= 2.5 ? "STD RATE" : ""}</text>
    </svg>
  );
}
export default memo(PFD);
