import type { HTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "", ...rest }: { children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-sm font-semibold uppercase tracking-wide text-muted mb-2 ${className}`}>{children}</h2>;
}
