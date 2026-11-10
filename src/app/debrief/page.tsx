import type { Metadata } from "next";
import { Suspense } from "react";
import DebriefApp from "@/components/debrief/DebriefApp";

export const metadata: Metadata = { title: "Debrief" };

export default function DebriefPage() {
  return (
    <Suspense>
      <DebriefApp />
    </Suspense>
  );
}
