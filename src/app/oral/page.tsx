import type { Metadata } from "next";
import { Suspense } from "react";
import OralApp from "@/components/chat/OralApp";

export const metadata: Metadata = { title: "Oral exam" };

export default function OralPage() {
  return (
    <Suspense>
      <OralApp />
    </Suspense>
  );
}
