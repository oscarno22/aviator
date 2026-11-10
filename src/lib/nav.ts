import type { IconName } from "@/components/Icon";

export type NavItem = { href: string; label: string; icon: IconName };

export const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/checklists", label: "Checklists", icon: "list" },
  { href: "/maneuvers", label: "Maneuvers", icon: "plane" },
  { href: "/sim", label: "Sim", icon: "gauge" },
  { href: "/review", label: "Review", icon: "reset" },
  { href: "/debrief", label: "Debrief", icon: "check" },
  { href: "/quiz", label: "Quiz", icon: "cards" },
  { href: "/cockpit", label: "Cockpit", icon: "cockpit" },
  { href: "/radio", label: "Radio", icon: "radio" },
  { href: "/oral", label: "Oral exam", icon: "mic" },
  { href: "/logbook", label: "Logbook", icon: "book" },
  { href: "/weather", label: "Weather", icon: "cloud" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export const MOBILE_TABS = ["/", "/checklists", "/maneuvers", "/sim"];
