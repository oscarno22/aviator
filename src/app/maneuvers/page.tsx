import type { Metadata } from "next";
import Link from "next/link";
import { MANEUVERS, MANEUVER_AREAS } from "@/data/maneuvers";
import PageHeader from "@/components/ui/PageHeader";
import Icon from "@/components/Icon";

export const metadata: Metadata = { title: "Maneuvers" };

export default function ManeuversPage() {
  return (
    <>
      <PageHeader title="Maneuvers" subtitle="Private Pilot ACS, flown in a 172S. Open one to chair-fly it." />
      {MANEUVER_AREAS.map((area) => {
        const items = MANEUVERS.filter((m) => m.area === area);
        if (!items.length) return null;
        return (
          <section key={area} className="mb-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{area}</h2>
            <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
              {items.map((m) => (
                <li key={m.id}>
                  <Link href={`/maneuvers/${m.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2">
                    <span>
                      <span className="block">{m.name}</span>
                      <span className="block text-xs text-muted">{m.acsRef}{m.simTaskId ? " · sim task" : ""}</span>
                    </span>
                    <Icon name="chevron" size={16} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
