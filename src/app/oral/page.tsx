import type { Metadata } from "next";
import OralApp from "@/components/chat/OralApp";

export const metadata: Metadata = { title: "Oral exam" };

export default function OralPage() {
  return <OralApp />;
}
