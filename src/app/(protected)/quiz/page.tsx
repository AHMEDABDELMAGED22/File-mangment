import { requireAuthWithProfile } from "@/services/auth.service";
import { getUserWorkspace } from "@/services/workspace.service";
import { QuizGeneratorClient } from "@/components/workspace/quiz-generator-client";
import { redirect } from "next/navigation";

export const metadata = {
  title: "AI Quiz Generator | AntiDrive",
  description: "Generate quizzes from your PDFs using AI.",
};

export default async function QuizPage() {
  const { profile } = await requireAuthWithProfile();
  const workspace = await getUserWorkspace(profile.id);
  
  if (!workspace) {
    redirect("/login");
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] w-full max-w-7xl mx-auto py-6 flex items-center justify-center">
      <QuizGeneratorClient />
    </div>
  );
}
