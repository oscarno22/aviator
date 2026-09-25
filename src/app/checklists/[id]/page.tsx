import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CHECKLISTS, checklistById } from "@/data/checklists";
import ChecklistRunner from "@/components/checklists/ChecklistRunner";

export const dynamicParams = false;

export function generateStaticParams() {
  return CHECKLISTS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: PageProps<"/checklists/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: checklistById(id)?.title ?? "Checklist" };
}

export default async function ChecklistPage({ params }: PageProps<"/checklists/[id]">) {
  const { id } = await params;
  const checklist = checklistById(id);
  if (!checklist) notFound();
  const idx = CHECKLISTS.findIndex((c) => c.id === id);
  const next = CHECKLISTS[idx + 1] ?? null;
  return <ChecklistRunner checklist={checklist} next={next ? { id: next.id, title: next.title } : null} />;
}
