import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "usim" };

export default function Page() {
  return (
    <>
      <PageHeader title="usim" subtitle="Coming in this build." />
    </>
  );
}
