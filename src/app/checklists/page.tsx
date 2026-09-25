import type { Metadata } from "next";
import Link from "next/link";
import { CHECKLISTS } from "@/data/checklists";
import PageHeader from "@/components/ui/PageHeader";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Checklists" };

export default function ChecklistsPage() {
  const normal = CHECKLISTS.filter((c) => c.phase === "normal");
  const emergency = CHECKLISTS.filter((c) => c.phase === "emergency");
  return (
    <>
      <PageHeader title="Checklists" subtitle="Cessna 172S. Bold titles are memory items: know them cold." />
      <Section title="Normal procedures" items={normal} />
      <Section title="Emergency procedures" items={emergency} danger />
      <p className="mt-6 text-xs text-muted">
        Written to follow the 172S POH flow. Always fly the checklist your school issues; if anything differs, theirs wins.
      </p>
    </>
  );
}

function Section({ title, items, danger }: { title: string; items: typeof CHECKLISTS; danger?: boolean }) {
  return (
    <section className="mb-6">
      <h2 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${danger ? "text-danger" : "text-muted"}`}>{title}</h2>
      <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
        {items.map((c) => (
          <li key={c.id}>
            <Link href={`/checklists/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2">
              <span className={c.memory ? "font-semibold" : ""}>{c.title}</span>
              <span className="flex items-center gap-2 text-xs text-muted">
                {c.items.length} items
                <Icon name="chevron" size={16} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
