"use client";

import { useState } from "react";
import { RADIO_SCENARIOS } from "@/data/radioScenarios";
import PageHeader from "@/components/ui/PageHeader";
import ChatPanel, { type ChatOption } from "./ChatPanel";

const OPTIONS: ChatOption[] = RADIO_SCENARIOS.map((s) => ({
  id: s.id, label: s.title, summary: s.situation,
  briefing: [...(s.atis ? [`ATIS: ${s.atis}`] : []), ...s.objectives.map((o) => `Graded: ${o}`)],
  frequency: `${s.facility} · ${s.frequency.toFixed(s.frequency.toString().split(".")[1]?.length ?? 1)}`,
  opensWith: s.opensWith,
}));

export default function RadioApp() {
  const [selected, setSelected] = useState<string | null>(OPTIONS[0].id);
  return (
    <>
      <PageHeader title="Radio" subtitle="Key the mic, say your call, get a controller and an instructor's ear." />
      <ChatPanel mode="radio" options={OPTIONS} selected={selected} onSelect={setSelected} placeholder="Concord Ground, Skyhawk one two three four five…" sendLabel="Transmit" />
    </>
  );
}
