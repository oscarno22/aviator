import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "uradio" };

export default function Page() {
  return (
    <>
      <PageHeader title="uradio" subtitle="Coming in this build." />
    </>
  );
}
