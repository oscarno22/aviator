import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "uoral" };

export default function Page() {
  return (
    <>
      <PageHeader title="uoral" subtitle="Coming in this build." />
    </>
  );
}
