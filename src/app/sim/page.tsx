import type { Metadata } from "next";
import { Suspense } from "react";
import SimApp from "@/components/sim/SimApp";

export const metadata: Metadata = { title: "Sim" };

export default function SimPage() {
  return (
    <Suspense>
      <SimApp />
    </Suspense>
  );
}
