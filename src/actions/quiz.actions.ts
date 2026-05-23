"use server";

import { generateQuizFromText } from "@/services/geminiService";
import type { QuizData, Language, QuestionType } from "@/types";

export interface QuizGenerationPayload {
  sourceText: string;
  numQuestions: number;
  difficulty: "easy" | "medium" | "hard";
  timeLimit: number; // in seconds
  language: Language;
  questionType: QuestionType;
  customPrompt?: string;
}

export async function generateQuiz(
  payload: QuizGenerationPayload
): Promise<{ data?: QuizData; error?: string }> {
  const {
    sourceText,
    numQuestions,
    difficulty,
    timeLimit,
    language,
    questionType,
    customPrompt,
  } = payload;

  if (!sourceText || sourceText.trim().length < 50) {
    return { error: "Source text is too short. Please provide more content." };
  }

  try {
    const quizData = await generateQuizFromText(
      sourceText,
      numQuestions,
      difficulty,
      language,
      questionType,
      customPrompt
    );

    // Attach the time limit to the quiz data
    if (timeLimit > 0) {
      quizData.timeLimit = timeLimit;
    }

    return { data: quizData };
  } catch (err: any) {
    console.error("Quiz generation error:", err);
    return {
      error:
        err.message || "Failed to generate quiz. Please try again later.",
    };
  }
}
