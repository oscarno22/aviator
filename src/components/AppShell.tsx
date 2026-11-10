"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Icon from "./Icon";
import { NAV, MOBILE_TABS } from "@/lib/nav";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const immersive = pathname.startsWith("/sim");

  if (immersive) {
    return <div className="flex-1 flex flex-col min-h-dvh">{children}</div>;
  }

  const tabs = NAV.filter((n) => MOBILE_TABS.includes(n.href));
  const moreActive = !tabs.some((t) => isActive(pathname, t.href));

  return (
    <div className="flex-1 flex min-h-dvh">
      {/* Desktop side nav */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-surface/60 pt-[var(--sat)]">
        <Link href="/" className="flex items-center gap-2 px-5 py-5 font-semibold tracking-tight">
          <span className="inline-block h-6 w-6 rounded-full bg-[linear-gradient(to_bottom,#3884e3_50%,#8b5a2b_50%)] ring-2 ring-fg/80" />
          <span className="text-silver">Aviator</span>
        </Link>
        <div aria-hidden className="mx-5 mb-3 flex h-0.5 overflow-hidden rounded-full">
          <span className="w-1/3 bg-trim" /><span className="w-1/3 bg-silver" /><span className="w-1/3 bg-accent" />
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {NAV.map((n) => {
            const active = isActive(pathname, n.href);
            return (
              <Link key={n.href} href={n.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${active ? "bg-surface-2 text-accent" : "text-muted hover:bg-surface-2 hover:text-fg"}`}>
                <Icon name={n.icon} size={18} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto px-5 pb-4 text-[11px] leading-snug text-muted">
          Training aid only. Verify every number against your POH, checklist and current ACS.
        </p>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div aria-hidden className="md:hidden fixed inset-x-0 top-0 z-40 flex h-[calc(var(--sat)+3px)] items-end bg-bg">
          <span className="h-[3px] w-1/3 bg-trim" /><span className="h-[3px] w-1/3 bg-silver" /><span className="h-[3px] w-1/3 bg-accent" />
        </div>
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-[calc(var(--sat)+16px)] pb-[calc(var(--sab)+88px)] md:pb-10">
          {children}
        </main>

        {/* Mobile bottom tabs */}
        <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur pb-[var(--sab)]">
          <ul className="grid grid-cols-5">
            {tabs.map((n) => {
              const active = isActive(pathname, n.href);
              return (
                <li key={n.href}>
                  <Link href={n.href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "text-accent" : "text-muted"}`}>
                    <Icon name={n.icon} />
                    {n.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link href="/more" className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${moreActive ? "text-accent" : "text-muted"}`}>
                <Icon name="more" />
                More
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
