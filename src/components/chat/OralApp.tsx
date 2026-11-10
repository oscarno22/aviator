"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ORAL_AREAS } from "@/data/oralTopics";
import { CONCEPTS } from "@/data/concepts";
import { useAiMode } from "@/lib/aiStatus";
import { customCardsKey, shuffle, srsKey, weakTags } from "@/lib/srsStore";
import { useStored } from "@/lib/useStored";
import PageHeader from "@/components/ui/PageHeader";
import Segmented from "@/components/ui/Segmented";
import CardDeck from "@/components/quiz/CardDeck";
import AiModeBar from "./AiModeBar";
import ChatPanel, { type ChatOption } from "./ChatPanel";
import OralBank from "./OralBank";

const AREA_OPTIONS: ChatOption[] = [
  { id: "all", label: "Whole checkride oral (all areas)", summary: "The examiner moves through every area of operation the way a real oral does.", briefing: ["Answer out loud, then type or dictate what you said.", "'I don't know' is allowed; you'll get the answer and see it again."] },
  ...ORAL_AREAS.map((a) => ({ id: a.id, label: `${a.acs} · ${a.label}`, summary: `Questions from ACS area ${a.acs}: ${a.label}.`, briefing: a.seeds.map((s) => `May cover: ${s}`) })),
];
const POP_OPTIONS: ChatOption[] = [
  { id: "pop", label: "Instructor pop quiz", summary: "Random 'what's that?' and 'why?' questions, the way your CFI asks them on the ramp. Weighted toward the cards you've been missing.", briefing: ["One question at a time, follow-ups when the answer is thin.", "Use 'Add to review deck' on anything you missed."] },
];

export default function OralApp() {
  const wanted = useSearchParams().get("area");
  const [mode, setMode] = useState<"oral" | "popquiz">("oral");
  const [area, setArea] = useState<string | null>(AREA_OPTIONS.find((o) => o.id === wanted)?.id ?? "all");
  const [round, setRound] = useState(0);
  const ai = useAiMode();
  const fail = { onOk: ai.noteOk, onSwitch: () => ai.goScripted("manual"), onFail: ai.noteFailure };
  return (
    <>
      <PageHeader title="Oral exam" subtitle="A designated examiner, or your instructor with a minute to kill."
        action={<Segmented value={mode} onChange={setMode} options={[{ value: "oral", label: "By area" }, { value: "popquiz", label: "Pop quiz" }]} />} />
      <AiModeBar ai={ai} what="question bank" />
      {ai.mode === "ai" ? (
        mode === "oral"
          ? <ChatPanel key="oral" mode="oral" options={AREA_OPTIONS} selected={area} onSelect={setArea} placeholder="Your answer…" sendLabel="Answer" {...fail} />
          : <ChatPanel key="pop" mode="popquiz" options={POP_OPTIONS} selected="pop" onSelect={() => {}} placeholder="Your answer…" sendLabel="Answer" {...fail} />
      ) : mode === "oral" ? (
        <OralBank initialArea={area ?? "all"} />
      ) : (
        <ScriptedPop key={round} onAgain={() => setRound((r) => r + 1)} />
      )}
    </>
  );
}

/** Pop quiz without Claude: ten cards, most of them from the areas the student has been missing. */
function ScriptedPop({ onAgain }: { onAgain: () => void }) {
  const [srs] = useStored(srsKey);
  const [custom] = useStored(customCardsKey);
  // Fixed for the life of this round: grading a card must not reshuffle the deck.
  const [seed] = useState(() => Math.random());
  const cards = useMemo(() => {
    const all = [...CONCEPTS, ...custom];
    const weak = new Set(weakTags(srs));
    const fromWeak = shuffle(all.filter((c) => weak.has(c.area)), seed).slice(0, 6);
    const rest = shuffle(all.filter((c) => !fromWeak.includes(c)), seed).slice(0, 10 - fromWeak.length);
    return shuffle([...fromWeak, ...rest], seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);
  return <CardDeck title="Pop quiz" cards={cards} mode="pop" onExit={onAgain} exitLabel="Another ten" />;
}
