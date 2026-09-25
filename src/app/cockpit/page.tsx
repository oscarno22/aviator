import type { Metadata } from "next";
import CockpitApp from "@/components/cockpit/CockpitApp";

export const metadata: Metadata = { title: "Cockpit" };

export default function CockpitPage() {
  return <CockpitApp />;
}
