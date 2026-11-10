"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { debriefsKey } from "@/lib/debrief";
import { recordOutcome, type ReviewKind } from "@/lib/review";
import { buildQueue, buildWarmup, queueSummary, warmupKey, WARMUP_BUDGET_MIN, type ReviewItem } from "@/lib/reviewQueue";
import { simResultsKey } from "@/lib/simResults";
import { todayStr, type Grade } from "@/lib/srs";
import { customCardsKey, srsKey } from "@/lib/srsStore";
import { useHydrated, useStored } from "@/lib/useStored";
import { OralQuestionCard } from "@/components/chat/OralBank";
import { GRADES } from "@/components/quiz/CardDeck";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/Icon";

const KIND_LABEL: Record<ReviewKind, string> = { debrief: "From your lessons", radio: "Radio drills", sim: "Sim tasks", oral: "Oral questions", card: "Quiz cards" };
const KIND_ORDER: ReviewKind[] = ["debrief", "radio", "sim", "oral", "card"];

/** Shared hook: today's queue from every source. */
export function useReviewQueue(): ReviewItem[] {
  const [srs] = useStored(srsKey);
  const [custom] = useStored(customCardsKey);
  const [simResults] = useStored(simResultsKey);
  const [debriefs] = useStored(debriefsKey);
  return useMemo(() => buildQueue({ srs, custom, simResults, debriefs, today: todayStr() }), [srs, custom, simResults, debriefs]);
}

export default function ReviewApp() {
  const hydrated = useHydrated();
  const router = useRouter();
  const running = useSearchParams().get("warmup") === "1";
  const queue = useReviewQueue();
  const [warmup, setWarmup] = useStored(warmupKey);
  const sum = queueSummary(queue);
  const today = todayStr();
  const plan = useMemo(() => buildWarmup(queue), [queue]);

  const startWarmup = () => {
    // Keep today's set if one is already under way; otherwise fix a new one.
    const fresh = warmup.date !== today || warmup.ids.every((id) => queue.find((q) => q.id === id)?.doneToday ?? true);
    if (fresh) setWarmup({ date: today, ids: plan.map((i) => i.id) });
    router.push("/review?warmup=1");
  };

  // Arriving straight at the runner (the dashboard button) with no set for today: fix one now.
  useEffect(() => {
    if (hydrated && running && warmup.date !== today) setWarmup({ date: today, ids: plan.map((i) => i.id) });
  }, [hydrated, running, warmup.date, today, plan, setWarmup]);

  if (!hydrated) return <PageHeader title="Review" />;

  if (running) {
    const ids = warmup.date === today ? warmup.ids : [];
    return <WarmupRunner ids={ids} queue={queue} onExit={() => router.push("/review")} />;
  }

  const minutes = Math.round(plan.reduce((m, i) => m + i.estMin, 0));
  const resume = warmup.date === today && warmup.ids.some((id) => queue.find((q) => q.id === id && !q.doneToday));

  return (
    <>
      <PageHeader title="Review" subtitle="Everything due or weak, from every part of the app, in one list." />

      <Card className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold tabular">{sum.open} <span className="text-sm font-normal text-muted">to review{sum.done ? ` · ${sum.done} done today` : ""}</span></p>
            <p className="text-xs text-muted">{plan.length ? `Warm-up: ${plan.length} item${plan.length === 1 ? "" : "s"}, about ${Math.max(1, minutes)} of ${WARMUP_BUDGET_MIN} minutes` : "Nothing waiting. Fly something, or debrief a lesson."}</p>
          </div>
          <Button variant="primary" className="shrink-0 whitespace-nowrap" onClick={startWarmup} disabled={plan.length === 0 && !resume}><Icon name="play" size={14} /> {resume ? "Resume" : "Warm up"}</Button>
        </div>
        <Link href="/debrief" className="mt-3 inline-block text-xs text-accent">Debrief a lesson →</Link>
      </Card>

      {KIND_ORDER.filter((k) => queue.some((i) => i.kind === k)).map((kind) => {
        const items = queue.filter((i) => i.kind === kind);
        const shown = kind === "card" ? items.slice(0, 5) : items;
        return (
          <Card key={kind} className="mb-3">
            <CardTitle>{KIND_LABEL[kind]} · {items.filter((i) => !i.doneToday).length}</CardTitle>
            <ul className="divide-y divide-border">
              {shown.map((it) => <QueueRow key={it.id} it={it} />)}
            </ul>
            {kind === "card" && <Link href="/quiz" className="mt-2 inline-block text-xs text-accent">{items.length > shown.length ? `All ${items.length} cards in the quiz →` : "Open the quiz →"}</Link>}
          </Card>
        );
      })}
    </>
  );
}

function QueueRow({ it }: { it: ReviewItem }) {
  const body = (
    <span className="min-w-0 flex-1">
      <span className={`block truncate text-sm ${it.doneToday ? "text-muted line-through" : ""}`}>{it.title}</span>
      <span className="block truncate text-xs text-muted">
        {it.detail ?? ""}{it.detail && (it.overdueDays || it.weak) ? " · " : ""}{it.overdueDays ? `${it.overdueDays} day${it.overdueDays === 1 ? "" : "s"} overdue` : ""}{it.overdueDays && it.weak ? " · " : ""}{it.weak ? "weak" : ""}
      </span>
    </span>
  );
  return (
    <li>
      {it.href ? (
        <Link href={it.href} className="flex items-center gap-2 py-2 hover:text-accent">{body}<Icon name="chevron" size={16} className="shrink-0 text-muted" /></Link>
      ) : <div className="flex items-center gap-2 py-2">{body}</div>}
    </li>
  );
}

/** Steps through today's fixed warm-up set. An item is finished once it has been attempted today. */
function WarmupRunner({ ids, queue, onExit }: { ids: string[]; queue: ReviewItem[]; onExit: () => void }) {
  const [, setDebriefs] = useStored(debriefsKey);
  const [skipped, setSkipped] = useState<string[]>([]);
  const items = ids.map((id) => queue.find((q) => q.id === id)).filter((x): x is ReviewItem => !!x);
  const left = items.filter((i) => !i.doneToday && !skipped.includes(i.id));
  const it = left[0];
  const doneCount = items.length - left.length;

  const gradeItem = (item: ReviewItem, g: Grade) => {
    recordOutcome(item.id, g);
    if (item.debrief && (g === "good" || g === "easy")) {
      const { debriefId, item: di } = item.debrief;
      setDebriefs((all) => all.map((d) => (d.id === debriefId ? { ...d, items: d.items.map((x) => (x.id === di.id ? { ...x, resolved: true } : x)) } : d)));
    }
  };

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <button onClick={onExit} className="flex items-center gap-1 hover:text-fg"><Icon name="x" size={14} /> Warm-up</button>
        <span className="tabular">{Math.min(doneCount + 1, items.length)} / {items.length}</span>
      </div>
      <div className="mb-4 h-1 w-full rounded bg-surface-2"><div className="h-full rounded bg-accent" style={{ width: `${(doneCount / Math.max(1, items.length)) * 100}%` }} /></div>

      {!it && (
        <div className="flex flex-col items-center py-16 text-center">
          <h2 className="text-xl font-semibold">{items.length ? "Warm-up complete" : "No warm-up set for today"}</h2>
          <p className="mt-2 text-sm text-muted">{items.length ? "Go fly. Debrief when you land." : "Start one from the review page."}</p>
          <Button variant="primary" className="mt-8" onClick={onExit}>Back to review</Button>
        </div>
      )}

      {it?.oral && <OralQuestionCard key={it.id} q={it.oral} onGrade={(g) => gradeItem(it, g)} />}
      {it?.card && <FlipCard key={it.id} q={it.card.q} a={it.card.a} why={it.card.why} onGrade={(g) => gradeItem(it, g)} />}

      {it?.debrief && (
        <div className="flex flex-1 flex-col">
          <div className="flex-1 rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-muted">{it.detail}</p>
            <p className="mt-3 text-lg font-medium leading-snug">{it.title}</p>
            <p className="mt-4 text-sm text-muted">Talk yourself through what you will do differently this time. Out loud.</p>
            {it.href && <Link href={it.href} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-2"><Icon name="plane" size={16} className="text-accent" /> Chair-fly it first</Link>}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button onClick={() => gradeItem(it, "again")} className="rounded-xl border border-danger/40 bg-surface px-2 py-3 text-sm font-medium text-danger">Still a problem</button>
            <button onClick={() => gradeItem(it, "hard")} className="rounded-xl border border-warn/40 bg-surface px-2 py-3 text-sm font-medium text-warn">Getting there</button>
            <button onClick={() => gradeItem(it, "good")} className="rounded-xl border border-ok/40 bg-surface px-2 py-3 text-sm font-medium text-ok">Sorted</button>
          </div>
        </div>
      )}

      {it && (it.kind === "radio" || it.kind === "sim") && (
        <div className="flex flex-1 flex-col">
          <div className="flex-1 rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-muted">{it.detail}</p>
            <p className="mt-3 text-lg font-medium leading-snug">{it.title}</p>
            <p className="mt-4 text-sm text-muted">This one opens in its own screen. Finish it there, then come back here: it will be ticked off.</p>
            <Link href={it.href!} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-bg">
              <Icon name={it.kind === "radio" ? "radio" : "gauge"} size={16} /> Open the {it.kind === "radio" ? "radio drill" : "sim task"}
            </Link>
          </div>
          <Button variant="ghost" className="mt-3" onClick={() => setSkipped((s) => [...s, it.id])}>Skip for now</Button>
        </div>
      )}
    </div>
  );
}

function FlipCard({ q, a, why, onGrade }: { q: string; a: string; why?: string; onGrade: (g: Grade) => void }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="flex flex-1 flex-col">
      <button className="flex flex-1 flex-col rounded-2xl border border-border bg-surface p-6 text-left" onClick={() => setFlipped(true)} aria-label="Reveal answer">
        <span className="text-xs uppercase tracking-wide text-muted">Quiz card</span>
        <span className="mt-3 text-xl font-medium leading-snug">{q}</span>
        {flipped ? (
          <span className="mt-6 border-t border-border pt-5">
            <span className="block text-lg leading-snug text-accent">{a}</span>
            {why && <span className="mt-3 block text-sm text-muted"><span className="font-semibold text-fg/80">Why? </span>{why}</span>}
          </span>
        ) : <span className="mt-auto pt-8 text-sm text-muted">Say it out loud, then tap to reveal</span>}
      </button>
      <div className={`mt-4 grid grid-cols-4 gap-2 transition ${flipped ? "" : "pointer-events-none opacity-30"}`}>
        {GRADES.map((x) => <button key={x.g} onClick={() => onGrade(x.g)} className={`rounded-xl border bg-surface px-2 py-3 text-sm font-medium ${x.cls}`}>{x.label}</button>)}
      </div>
    </div>
  );
}
