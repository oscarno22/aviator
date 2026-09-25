import type { Metadata } from "next";
import { Suspense } from "react";
import QuizApp from "@/components/quiz/QuizApp";

export const metadata: Metadata = { title: "Quiz" };

export default function QuizPage() {
  return (
    <Suspense>
      <QuizApp />
    </Suspense>
  );
}
