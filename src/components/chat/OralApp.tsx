"use client";

import { useState } from "react";
import { ORAL_AREAS } from "@/data/oralTopics";
import PageHeader from "@/components/ui/PageHeader";
import Segmented from "@/components/ui/Segmented";
import ChatPanel, { type ChatOption } from "./ChatPanel";

const AREA_OPTIONS: ChatOption[] = [
  { id: "all", label: "Whole checkride oral (all areas)", summary: "The examiner moves through every area of operation the way a real oral does.", briefing: ["Answer out loud, then type or dictate what you said.", "'I don't know' is allowed; you'll get the answer and see it again."] },
  ...ORAL_AREAS.map((a) => ({ id: a.id, label: `${a.acs} · ${a.label}`, summary: `Questions from ACS area ${a.acs}: ${a.label}.`, briefing: a.seeds.map((s) => `May cover: ${s}`) })),
];
const POP_OPTIONS: ChatOption[] = [
  { id: "pop", label: "Instructor pop quiz", summary: "Random 'what's that?' and 'why?' questions, the way your CFI asks them on the ramp. Weighted toward the cards you've been missing.", briefing: ["One question at a time, follow-ups when the answer is thin.", "Use 'Add to review deck' on anything you missed."] },
];

export default function OralApp() {
  const [mode, setMode] = useState<"oral" | "popquiz">("oral");
  const [area, setArea] = useState<string | null>("all");
  return (
    <>
      <PageHeader title="Oral exam" subtitle="A designated examiner, or your instructor with a minute to kill."
        action={<Segmented value={mode} onChange={setMode} options={[{ value: "oral", label: "By area" }, { value: "popquiz", label: "Pop quiz" }]} />} />
      {mode === "oral" ? (
        <ChatPanel key="oral" mode="oral" options={AREA_OPTIONS} selected={area} onSelect={setArea} placeholder="Your answer…" sendLabel="Answer" />
      ) : (
        <ChatPanel key="pop" mode="popquiz" options={POP_OPTIONS} selected="pop" onSelect={() => {}} placeholder="Your answer…" sendLabel="Answer" />
      )}
    </>
  );
}
