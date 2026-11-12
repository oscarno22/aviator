"use client";

import { memo } from "react";
import { PATTERN } from "@/data/procedures";
import { NM_TO_M } from "@/lib/units";
import { glidepathAngleDeg, LEG_LABEL, type Leg } from "@/sim/pattern";
import { relHeadingDeg, toFrame, type RunwayFrame } from "@/sim/world";

/**
 * Top-down pattern map, runway pointing up. There is no outside view, so this,
 * the glidepath lights and the centreline bar are the only approach cues.
 * Works live (pass the airplane position) or after the run (track only).
 */
export interface PlaneAt { x: number; y: number; hdgRad: number; aglFt: number }

const DOWNWIND_M = PATTERN.downwindOffsetNm * NM_TO_M;
const BASE_ALONG_M = -0.6 * NM_TO_M;   // drawing only: where the ideal base leg sits
const TURN_PAST_END_M = 600;           // drawing only: crosswind turn past the departure end

function PatternMapImpl({ frame, track, plane, leg, compact }:
  { frame: RunwayFrame; track?: [number, number][]; plane?: PlaneAt; leg?: Leg | null; compact?: boolean }) {
  // Screen x: pattern side drawn on the side it really is when facing the landing direction.
  const sx = (cross: number) => (frame.patternSide === "left" ? -cross : cross);
  const sy = (along: number) => -along;

  const minAlong = -1.1 * NM_TO_M, maxAlong = frame.lengthM + TURN_PAST_END_M + 300;
  const maxCross = DOWNWIND_M + 400, minCross = -500;
  const xs = [sx(minCross), sx(maxCross)];
  const vb = { x: Math.min(...xs), y: sy(maxAlong), w: Math.abs(xs[1] - xs[0]), h: maxAlong - minAlong };

  const ideal: [number, number][] = [
    [0, 0], [frame.lengthM + TURN_PAST_END_M, 0], [frame.lengthM + TURN_PAST_END_M, DOWNWIND_M],
    [BASE_ALONG_M, DOWNWIND_M], [BASE_ALONG_M, 0], [0, 0],
  ];
  const pts = (p: [number, number][]) => p.map(([a, c]) => `${sx(c).toFixed(0)},${sy(a).toFixed(0)}`).join(" ");

  const here = plane ? toFrame(frame, plane.x, plane.y) : null;
  const rel = plane ? relHeadingDeg(frame, plane.hdgRad) : 0;
  // relHeadingDeg is positive toward the pattern side; turn that into a screen rotation.
  const screenDeg = frame.patternSide === "left" ? -rel : rel;
  const size = vb.w / 11;

  const onFinal = leg === "final" && here && plane && plane.aglFt > 1;
  const angle = onFinal ? glidepathAngleDeg(here!.along, plane!.aglFt) : 0;
  const whites = PATTERN.papiDeg.filter((d) => angle > d).length;
  const dev = here ? Math.max(-1, Math.min(1, sx(here.cross) / PATTERN.centrelineBarM)) : 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-2">
      <div className="flex items-start gap-2">
        <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} className={compact ? "h-40 w-28" : "h-52 w-36 shrink-0"} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Pattern map">
          <polyline points={pts(ideal)} fill="none" stroke="var(--border)" strokeWidth={1.5} strokeDasharray="5 5" vectorEffect="non-scaling-stroke" />
          <line x1={sx(0)} y1={sy(0)} x2={sx(0)} y2={sy(frame.lengthM)} stroke="var(--silver)" strokeWidth={5} vectorEffect="non-scaling-stroke" />
          <line x1={sx(0)} y1={sy(0)} x2={sx(0)} y2={sy(-1 * NM_TO_M)} stroke="var(--border)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {track && track.length > 1 && (
            <polyline points={pts(track)} fill="none" stroke="var(--accent)" strokeWidth={1.75} vectorEffect="non-scaling-stroke" />
          )}
          {here && (
            <g transform={`translate(${sx(here.cross)} ${sy(here.along)}) rotate(${screenDeg})`}>
              <polygon points={`0,${-size} ${size * 0.6},${size * 0.7} 0,${size * 0.35} ${-size * 0.6},${size * 0.7}`} fill="var(--fg)" />
            </g>
          )}
        </svg>
        <div className="min-w-0 flex-1 space-y-2 text-xs">
          {leg !== undefined && <p className="text-sm font-semibold">{leg ? LEG_LABEL[leg] : "Joining the pattern"}</p>}
          {plane && here && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 font-mono tabular">
              <dt className="text-muted">AGL</dt><dd>{Math.max(0, plane.aglFt).toFixed(0)} ft</dd>
              <dt className="text-muted">Threshold</dt><dd>{(Math.abs(here.along) / NM_TO_M).toFixed(1)} nm {here.along < 0 ? "ahead" : "behind"}</dd>
            </dl>
          )}
          {onFinal && (
            <div>
              <p className="mb-1 text-muted">Glidepath</p>
              <div className="flex gap-1.5" aria-label={`${whites} white, ${4 - whites} red`}>
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`h-3 w-3 rounded-full ${i < whites ? "bg-fg" : "bg-danger"}`} />
                ))}
              </div>
              <p className="mb-1 mt-2 text-muted">Centreline</p>
              <div className="relative h-3 rounded bg-surface-2">
                <span className="absolute left-1/2 top-0 h-full w-px bg-border" />
                <span className="absolute top-0 h-full w-1.5 -translate-x-1/2 rounded bg-accent" style={{ left: `${50 + dev * 50}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(PatternMapImpl);
