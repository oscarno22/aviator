import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "ulogbook" };

export default function Page() {
  return (
    <>
      <PageHeader title="ulogbook" subtitle="Coming in this build." />
    </>
  );
}
