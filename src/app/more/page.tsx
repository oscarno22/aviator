import type { Metadata } from "next";
import Link from "next/link";
import { NAV } from "@/lib/nav";
import Icon from "@/components/Icon";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "More" };

const HIDDEN = new Set(["/", "/checklists", "/maneuvers", "/sim"]);

export default function MorePage() {
  return (
    <>
      <PageHeader title="More" />
      <ul className="overflow-hidden rounded-xl border border-border bg-surface divide-y divide-border">
        {NAV.filter((n) => !HIDDEN.has(n.href)).map((n) => (
          <li key={n.href}>
            <Link href={n.href} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
              <Icon name={n.icon} size={20} className="text-muted" />
              <span className="flex-1">{n.label}</span>
              <Icon name="chevron" size={16} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
