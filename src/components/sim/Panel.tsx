"use client";

import { memo } from "react";
import type { InstrumentReadout, ControlInputs } from "@/sim/types";
import Airspeed from "@/components/instruments/Airspeed";
import Attitude from "@/components/instruments/Attitude";
import Altimeter from "@/components/instruments/Altimeter";
import TurnCoordinator from "@/components/instruments/TurnCoordinator";
import HeadingIndicator from "@/components/instruments/HeadingIndicator";
import VSI from "@/components/instruments/VSI";
import Tach from "@/components/instruments/Tach";
import FlapIndicator from "@/components/instruments/FlapIndicator";
import PFD from "@/components/instruments/PFD";

function Panel({ r, inputs, covered, hobbs, style = "sixpack" }: { r: InstrumentReadout; inputs: ControlInputs; covered: boolean; hobbs: number; style?: "sixpack" | "pfd" }) {
  return (
    <div className="relative">
      {style === "pfd" ? (
        <PFD r={r} />
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Airspeed ias={r.ias} />
          <Attitude pitch={r.pitch} bank={r.bank} />
          <Altimeter alt={r.alt} />
          <TurnCoordinator turnRate={r.turnRate} rollRate={r.rollRate} ball={r.ball} />
          <HeadingIndicator hdg={r.hdg} />
          <VSI vs={r.vs} />
        </div>
      )}
      <div className="mt-2 flex items-stretch gap-2 sm:gap-3">
        <div className="w-[30%] max-w-[160px]"><Tach rpm={r.rpm} hobbs={hobbs} /></div>
        <div className="h-auto w-[14%] max-w-[80px]"><FlapIndicator flaps={r.flaps} selected={inputs.flaps} /></div>
        <div className="flex flex-1 flex-col justify-between rounded-xl border border-border bg-surface p-3 font-mono text-xs">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 tabular sm:grid-cols-4">
            <Readout label="IAS" value={`${r.ias.toFixed(0)} kt`} />
            <Readout label="ALT" value={`${r.alt.toFixed(0)} ft`} />
            <Readout label="HDG" value={`${String(Math.round(r.hdg) % 360 || 360).padStart(3, "0")}°`} />
            <Readout label="VS" value={`${r.vs >= 0 ? "+" : ""}${r.vs.toFixed(0)}`} />
            <Readout label="THR" value={`${(inputs.throttle * 100).toFixed(0)}%`} />
            <Readout label="TRIM" value={`${inputs.trim >= 0 ? "+" : ""}${inputs.trim.toFixed(2)}`} />
            <Readout label="G" value={r.g.toFixed(2)} />
            <Readout label="BALL" value={`${r.ball >= 0 ? "R" : "L"} ${Math.abs(r.ball).toFixed(2)}`} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Flag on={r.horn && !r.stalled} text="STALL WARN" cls="bg-warn text-bg" />
            <Flag on={r.stalled} text="STALL" cls="bg-danger text-bg" />
            <Flag on={r.engineOut} text="ENGINE OUT" cls="bg-danger text-bg" />
            <Flag on={r.crashed} text="CRASHED" cls="bg-danger text-bg" />
            <Flag on={r.ias > 129 && r.ias <= 163} text="YELLOW ARC" cls="bg-warn text-bg" />
            <Flag on={r.ias > 163} text="OVER VNE" cls="bg-danger text-bg" />
          </div>
        </div>
      </div>
      {covered && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-bg/95 text-center">
          <div>
            <p className="text-2xl font-semibold">Eyes closed</p>
            <p className="mt-1 text-sm text-muted">Instruments covered. Recover when they reappear.</p>
          </div>
        </div>
      )}
    </div>
  );
}
export default memo(Panel);

function Readout({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-2"><span className="text-muted">{label}</span><span>{value}</span></div>;
}
function Flag({ on, text, cls }: { on: boolean; text: string; cls: string }) {
  if (!on) return null;
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${cls} ${text === "STALL" || text === "STALL WARN" ? "pulse-amber" : ""}`}>{text}</span>;
}
