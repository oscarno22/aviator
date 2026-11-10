import Link from "next/link";
import { NAV } from "@/lib/nav";
import Icon from "@/components/Icon";
import DashboardCards from "@/components/dashboard/DashboardCards";

export default function Home() {
  const links = NAV.filter((n) => n.href !== "/" && n.href !== "/settings");
  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Aviator</h1>
        <p className="mt-1 text-sm text-muted">Cessna 172S · Private pilot · Charlotte</p>
      </header>
      <DashboardCards />
      <h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted">Train</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {links.map((n) => (
          <Link key={n.href} href={n.href} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 hover:bg-surface-2">
            <Icon name={n.icon} size={22} className="text-accent" />
            <span className="text-sm font-medium">{n.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
