import type { Metadata } from "next";
import LogbookApp from "@/components/logbook/LogbookApp";

export const metadata: Metadata = { title: "Logbook" };

export default function LogbookPage() {
  return <LogbookApp />;
}
