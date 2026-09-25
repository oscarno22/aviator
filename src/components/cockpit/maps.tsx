"use client";

import type { CockpitItem, Hotspot, Zone } from "@/data/cockpit";
import { itemsInZone } from "@/data/cockpit";

export const VIEWBOX: Record<Zone, string> = { panel: "0 0 1000 560", walkaround: "0 0 1000 720" };

export function HotspotShape({ item, state, showLabel, onClick }:
  { item: CockpitItem; state: "idle" | "selected" | "target"; showLabel: boolean; onClick: () => void }) {
  const h = item.hotspot;
  const stroke = state === "idle" ? "var(--border)" : "var(--amber)";
  const fill = state === "target" ? "rgba(245,178,58,0.35)" : state === "selected" ? "rgba(245,178,58,0.15)" : "rgba(26,36,57,0.9)";
  const cls = state === "target" ? "cockpit-target" : "";
  const center = "cx" in h ? { x: h.cx, y: h.cy } : { x: h.x + h.w / 2, y: h.y + h.h / 2 };
  return (
    <g onClick={onClick} className={`cursor-pointer ${cls}`} role="button" aria-label={showLabel ? item.name : "Unlabeled item"}>
      {"cx" in h
        ? <circle cx={h.cx} cy={h.cy} r={h.r} fill={fill} stroke={stroke} strokeWidth={state === "idle" ? 1.5 : 3} />
        : <rect x={h.x} y={h.y} width={h.w} height={h.h} rx={6} fill={fill} stroke={stroke} strokeWidth={state === "idle" ? 1.5 : 3} />}
      {showLabel && (
        <text x={center.x} y={center.y} textAnchor="middle" dominantBaseline="middle" fontSize={"cx" in h ? Math.max(10, h.r * 0.34) : 11} fill="var(--fg)" style={{ pointerEvents: "none", fontFamily: "var(--font-mono)" }}>
          {item.short}
        </text>
      )}
    </g>
  );
}

function PanelBackdrop() {
  return (
    <g>
      <rect x={4} y={4} width={992} height={552} rx={18} fill="var(--surface)" stroke="var(--border)" />
      <rect x={4} y={4} width={992} height={44} rx={18} fill="var(--surface-2)" />
      <text x={14} y={30} fontSize={11} fill="var(--muted)">GLARESHIELD</text>
      {/* six-pack bezel */}
      <rect x={96} y={66} width={308} height={210} rx={10} fill="none" stroke="var(--border)" strokeDasharray="4 4" />
      <text x={104} y={62} fontSize={10} fill="var(--muted)">SIX-PACK</text>
      <rect x={22} y={62} width={86} height={248} rx={8} fill="none" stroke="var(--border)" strokeDasharray="4 4" />
      <text x={26} y={325} fontSize={10} fill="var(--muted)">ENGINE</text>
      <rect x={424} y={54} width={152} height={258} rx={8} fill="none" stroke="var(--border)" strokeDasharray="4 4" />
      <text x={430} y={324} fontSize={10} fill="var(--muted)">RADIO STACK</text>
      <rect x={640} y={60} width={340} height={260} rx={10} fill="none" stroke="var(--border)" strokeDasharray="4 4" />
      <text x={648} y={332} fontSize={10} fill="var(--muted)">RIGHT SEAT / GLOVE BOX</text>
      <text x={120} y={430} fontSize={10} fill="var(--muted)">SWITCHES</text>
      <text x={440} y={362} fontSize={10} fill="var(--muted)">POWER QUADRANT</text>
      <text x={470} y={500} fontSize={10} fill="var(--muted)">FLOOR</text>
    </g>
  );
}

function WalkaroundBackdrop() {
  return (
    <g fill="var(--surface-2)" stroke="var(--border)" strokeWidth={2}>
      {/* prop arc */}
      <ellipse cx={500} cy={40} rx={140} ry={12} fill="none" strokeDasharray="6 6" />
      {/* fuselage */}
      <path d="M470 60 Q500 20 530 60 L545 300 L540 470 L520 640 L480 640 L460 470 L455 300 Z" />
      {/* wings */}
      <path d="M10 205 L455 195 L545 195 L990 205 L985 250 L545 255 L455 255 L15 250 Z" />
      {/* struts */}
      <line x1={460} y1={300} x2={250} y2={240} stroke="var(--muted)" />
      <line x1={540} y1={300} x2={750} y2={240} stroke="var(--muted)" />
      {/* horizontal stab */}
      <path d="M340 560 L660 560 L660 600 L340 600 Z" />
      {/* fin */}
      <path d="M492 470 L508 470 L512 640 L488 640 Z" fill="var(--border)" />
      {/* wheels */}
      <rect x={485} y={240} width={30} height={40} rx={8} fill="var(--border)" />
      <rect x={395} y={315} width={28} height={40} rx={8} fill="var(--border)" />
      <rect x={577} y={315} width={28} height={40} rx={8} fill="var(--border)" />
      <text x={20} y={30} fontSize={12} fill="var(--muted)" stroke="none">TOP VIEW · nose at top · left wing on the left</text>
    </g>
  );
}

export function ZoneMap({ zone, selectedId, targetId, showLabels, onSelect }:
  { zone: Zone; selectedId: string | null; targetId: string | null; showLabels: boolean; onSelect: (item: CockpitItem) => void }) {
  const items = itemsInZone(zone);
  return (
    <svg viewBox={VIEWBOX[zone]} className="w-full h-auto select-none" role="img" aria-label={zone === "panel" ? "Cessna 172S instrument panel" : "Cessna 172S walkaround"}>
      <style>{`.cockpit-target { animation: cockpit-pulse 1.1s ease-in-out infinite; } @keyframes cockpit-pulse { 50% { opacity: 0.55; } }`}</style>
      {zone === "panel" ? <PanelBackdrop /> : <WalkaroundBackdrop />}
      {items.map((item) => (
        <HotspotShape key={item.id} item={item}
          state={item.id === targetId ? "target" : item.id === selectedId ? "selected" : "idle"}
          showLabel={showLabels} onClick={() => onSelect(item)} />
      ))}
    </svg>
  );
}

export function hotspotCenter(h: Hotspot) {
  return "cx" in h ? { x: h.cx, y: h.cy } : { x: h.x + h.w / 2, y: h.y + h.h / 2 };
}
