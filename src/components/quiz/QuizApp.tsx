"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CONCEPTS, CONCEPT_AREAS, type ConceptArea, type ConceptCard } from "@/data/concepts";
import { srsKey, customCardsKey, buildReviewQueue, dueCount, shuffle } from "@/lib/srsStore";
import { useStored } from "@/lib/useStored";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/Icon";
import CardDeck from "./CardDeck";

type Mode = "review" | "area" | "pop";

export default function QuizApp() {
  const params = useSearchParams();
  const [all] = useStored(srsKey);
  const [custom] = useStored(customCardsKey);
  const deck = useMemo(() => [...CONCEPTS, ...custom], [custom]);
  // Deep link: /quiz?mode=pop from the dashboard starts a pop quiz immediately.
  const [session, setSession] = useState<{ mode: Mode; cards: ConceptCard[]; title: string } | null>(() =>
    params.get("mode") === "pop" ? { mode: "pop", cards: shuffle(CONCEPTS).slice(0, 5), title: "Pop quiz" } : null
  );
  const [area, setArea] = useState<ConceptArea>("airspace");
  const stats = useMemo(() => dueCount(all, deck), [all, deck]);
  const perArea = useMemo(() => Object.fromEntries(CONCEPT_AREAS.map((a) => [a.id, dueCount(all, CONCEPTS.filter((c) => c.area === a.id))])), [all]);

  const startReview = () => setSession({ mode: "review", cards: buildReviewQueue(all, deck), title: "Review" });
  const startPop = () => setSession({ mode: "pop", cards: shuffle(CONCEPTS).slice(0, 5), title: "Pop quiz" });
  const startArea = (a: ConceptArea) => setSession({ mode: "area", cards: shuffle(CONCEPTS.filter((c) => c.area === a)), title: CONCEPT_AREAS.find((x) => x.id === a)!.label });

  if (session) {
    return <CardDeck key={session.title + session.cards.length} title={session.title} cards={session.cards} mode={session.mode} onExit={() => setSession(null)} />;
  }

  return (
    <>
      <PageHeader title="Quiz" subtitle="The questions instructors actually ask. Say the answer out loud before you flip." />

      <Card className="mb-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat label="Due" value={stats.due} accent={stats.due > 0} />
          <Stat label="New" value={stats.fresh} />
          <Stat label="Learned" value={stats.learned} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={startReview} disabled={stats.due + stats.fresh === 0}>
            <Icon name="play" size={16} /> Review {stats.due > 0 ? `${stats.due} due` : "new cards"}
          </Button>
          <Button onClick={startPop}><Icon name="cards" size={16} /> Pop quiz me (5)</Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Drill by area</CardTitle>
        <ul className="divide-y divide-border">
          {CONCEPT_AREAS.map((a) => {
            const s = perArea[a.id];
            const total = CONCEPTS.filter((c) => c.area === a.id).length;
            return (
              <li key={a.id}>
                <button className="flex w-full items-center justify-between py-2.5 text-left hover:text-amber" onClick={() => { setArea(a.id); startArea(a.id); }}>
                  <span>
                    <span className="block text-sm">{a.label}</span>
                    <span className="block text-xs text-muted">ACS {a.acs} · {total} cards · {s.learned} learned{s.due ? ` · ${s.due} due` : ""}</span>
                  </span>
                  <Icon name="chevron" size={16} className="text-muted" />
                </button>
              </li>
            );
          })}
        </ul>
        {custom.length > 0 && (
          <button className="mt-2 flex w-full items-center justify-between border-t border-border py-2.5 text-left hover:text-amber" onClick={() => setSession({ mode: "area", cards: shuffle(custom), title: "Saved from pop quizzes" })}>
            <span><span className="block text-sm">Saved from pop quizzes</span><span className="block text-xs text-muted">{custom.length} cards</span></span>
            <Icon name="chevron" size={16} className="text-muted" />
          </button>
        )}
        <p className="mt-3 text-xs text-muted">Currently focused on: {CONCEPT_AREAS.find((a) => a.id === area)?.label}. Grades in a drill still feed the review schedule.</p>
      </Card>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <div className={`text-2xl font-semibold tabular ${accent ? "text-amber" : ""}`}>{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
