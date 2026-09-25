import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "uweather" };

export default function Page() {
  return (
    <>
      <PageHeader title="uweather" subtitle="Coming in this build." />
    </>
  );
}
