"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { RADIO_SCENARIOS } from "@/data/radioScenarios";
import { isDownFailure, useAiMode } from "@/lib/aiStatus";
import PageHeader from "@/components/ui/PageHeader";
import AiModeBar from "./AiModeBar";
import ChatPanel, { type ChatOption } from "./ChatPanel";
import RadioDrill from "./RadioDrill";

const OPTIONS: ChatOption[] = RADIO_SCENARIOS.map((s) => ({
  id: s.id, label: s.title, summary: s.situation,
  briefing: [...(s.atis ? [`ATIS: ${s.atis}`] : []), ...s.objectives.map((o) => `Graded: ${o}`)],
  frequency: `${s.facility} · ${s.frequency.toFixed(s.frequency.toString().split(".")[1]?.length ?? 1)}`,
  opensWith: s.opensWith,
}));

export default function RadioApp() {
  const wanted = useSearchParams().get("scenario");
  const [selected, setSelected] = useState<string | null>(OPTIONS.find((o) => o.id === wanted)?.id ?? OPTIONS[0].id);
  // The call that was being made when Claude failed, handed to the drill so it is not lost.
  const [carried, setCarried] = useState<string | null>(null);
  const ai = useAiMode();
  return (
    <>
      <PageHeader title="Radio" subtitle="Key the mic, say your call, get a controller and an instructor's ear." />
      <AiModeBar ai={ai} what="scripted drill" />
      {ai.mode === "ai" ? (
        <ChatPanel mode="radio" options={OPTIONS} selected={selected} onSelect={setSelected} placeholder="Concord Ground, Skyhawk one two three four five…" sendLabel="Transmit"
          onOk={ai.noteOk} onSwitch={() => ai.goScripted("manual")}
          onFail={(kind, gotText, firstCall) => { if (isDownFailure(kind, gotText)) setCarried(firstCall); ai.noteFailure(kind, gotText); }} />
      ) : (
        <RadioDrill key={carried ?? "drill"} options={OPTIONS} selected={selected} onSelect={(id) => { setSelected(id); setCarried(null); }} initialCall={carried} />
      )}
    </>
  );
}
