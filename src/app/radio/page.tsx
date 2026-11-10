import type { Metadata } from "next";
import { Suspense } from "react";
import RadioApp from "@/components/chat/RadioApp";

export const metadata: Metadata = { title: "Radio" };

export default function RadioPage() {
  return (
    <Suspense>
      <RadioApp />
    </Suspense>
  );
}
