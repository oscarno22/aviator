import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MANEUVERS, maneuverById } from "@/data/maneuvers";
import ManeuverDetail from "@/components/maneuvers/ManeuverDetail";

export const dynamicParams = false;

export function generateStaticParams() {
  return MANEUVERS.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: PageProps<"/maneuvers/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: maneuverById(id)?.name ?? "Maneuver" };
}

export default async function ManeuverPage({ params }: PageProps<"/maneuvers/[id]">) {
  const { id } = await params;
  const m = maneuverById(id);
  if (!m) notFound();
  return <ManeuverDetail maneuver={m} />;
}
