import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary: "bg-accent text-bg hover:brightness-110",
  secondary: "bg-surface-2 text-fg border border-border hover:bg-surface",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  danger: "bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25",
};

export default function Button({ variant = "secondary", className = "", ...rest }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof VARIANTS }) {
  return (
    <button className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`} {...rest} />
  );
}
