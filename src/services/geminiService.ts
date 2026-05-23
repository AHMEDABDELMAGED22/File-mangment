
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { QuizData, Quiz, Language, QuestionType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const getQuizSchema = (language: Language, questionType: QuestionType): Schema => {
  let optionsDescription = "An array of options.";
  
  if (language === 'ar') {
     if (questionType === 'true_false') {
         optionsDescription = "مصفوفة تحتوي بالضبط على عنصرين: 'صح' و 'خطأ'.";
     } else if (questionType === 'mcq') {
         optionsDescription = "يجب أن تحتوي هذه المصفوفة بالضبط على 4 خيارات.";
     } else if (questionType === 'essay') {
         optionsDescription = "يجب أن تكون هذه المصفوفة فارغة للأسئلة المقالية.";
     } else {
         optionsDescription = "مصفوفة من الخيارات (4 للمتعدد، 2 للصح/خطأ).";
     }
  } else {
     if (questionType === 'true_false') {
         optionsDescription = "An array containing EXACTLY two strings: 'True' and 'False'.";
     } else if (questionType === 'mcq') {
         optionsDescription = "This array must contain EXACTLY 4 multiple-choice options.";
     } else if (questionType === 'essay') {
         optionsDescription = "This array must be empty for essay questions.";
     } else {
         optionsDescription = "An array of options (4 for MCQ, 2 for True/False).";
     }
  }

  return {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: language === 'ar' 
          ? "عنوان قصير وجذاب للاختبار بناءً على النص المصدر."
          : "A short, engaging title for the quiz based on the source text."
      },
      questions: {
        type: Type.ARRAY,
        description: language === 'ar' ? "مجموعة من أسئلة الاختبار." : "An array of quiz questions.",
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: language === 'ar' ? "نص السؤال." : "The question text." },
            options: {
              type: Type.ARRAY,
              description: optionsDescription,
              items: { type: Type.STRING }
            },
            answer: { type: Type.STRING, description: language === 'ar' ? "الإجابة النموذجية أو المفتاحية للسؤال." : "The model or key answer for the question." },
            explanation: { type: Type.STRING, description: language === 'ar' ? "شرح مفصل للإجابة وكيفية الوصول إليها من النص." : "A detailed explanation of the answer and how it's derived from the text." }
          },
          required: ["question", "options", "answer", "explanation"]
        }
      }
    },
    required: ["title", "questions"]
  };
};

const getPrompt = (sourceText: string, numQuestions: number, difficulty: string, language: Language, questionType: QuestionType, customPrompt?: string) => {
    let typeInstruction = '';
    
    if (language === 'ar') {
        if (questionType === 'mcq') {
            typeInstruction = "3. كل سؤال **يجب** أن يحتوي على 4 خيارات بالضبط. لا أكثر ولا أقل.";
        } else if (questionType === 'true_false') {
            typeInstruction = "3. كل سؤال **يجب** أن يكون بصيغة (صح/خطأ). مصفوفة الخيارات يجب أن تكون ['صح', 'خطأ'] فقط.";
        } else if (questionType === 'essay') {
            typeInstruction = "3. نوع الأسئلة: **أسئلة مقالية تحليلية**. لا تضف أي خيارات. الإجابة (answer) يجب أن تكون فقرة نموذجية تشرح المفهوم المطلوب بناءً على النص.";
        } else {
            typeInstruction = "3. نوع الأسئلة: مزيج من متعدد الخيارات وصح/خطأ.";
        }

        const difficultyMap: { [key: string]: string } = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };
        const customPromptInstruction = customPrompt ? `9.  **تركيز مخصص:** ${customPrompt}\n` : '';
        return `
            أنت صانع اختبارات صارم جداً. بناءً على النص المصدر التالي، قم بإنشاء اختبار باللغة العربية.

            **قواعد صارمة (يجب الالتزام بها حرفياً):**
            - يجب أن تكون جميع الأسئلة والإجابات مستمدة حصرياً من النص المصدر المرفق فقط.
            - يُمنع منعاً باتاً اختراع أي معلومات، أو استخدام معرفة خارجية، أو وضع افتراضات.
            - إذا لم يكن النص المصدر يحتوي على معلومات كافية لإنشاء ${numQuestions} أسئلة، قم بإنشاء الأسئلة الممكنة فقط (حتى لو كان العدد أقل من المطلوب، أو 0).
            - كل إجابة يجب أن تكون قابلة للتتبع المباشر من النص.

            **التعليمات الهامة:**
            1. حاول إنشاء ${numQuestions} سؤالاً إذا سمح النص بذلك.
            2. مستوى الصعوبة: ${difficultyMap[difficulty]}.
            ${typeInstruction}
            4. تأكد من أن الأسئلة تغطي النقاط الجوهرية في الفصول المذكورة في النص (مثل مفاهيم المناهج، أنواعها، التقويم).
            5. قدم شرحاً نموذجياً في حقل (explanation).
            6. العنوان يجب أن يكون معبراً عن محتوى الفصول.
            7. لا تقم بتضمين أي نص تمهيدي، فقط JSON.
            ${customPromptInstruction}
            **النص المصدر:**
            ---
            ${sourceText}
            ---
        `;
    }
    
    if (questionType === 'mcq') {
        typeInstruction = "3. Each question MUST have exactly 4 options.";
    } else if (questionType === 'true_false') {
        typeInstruction = "3. FORMAT: True/False Questions ONLY.";
    } else if (questionType === 'essay') {
        typeInstruction = "3. FORMAT: Analytical Essay Questions. No options required. The 'answer' should be a model paragraph.";
    } else {
        typeInstruction = "3. Question types: A mix of Multiple Choice and True/False.";
    }

    const customPromptInstruction = customPrompt ? `9.  **Custom Focus:** ${customPrompt}\n` : '';
    return `
        You are a highly strict quiz generator. Based on the following source text, generate a quiz.
        
        **STRICT RULES (MUST FOLLOW):**
        - You MUST ONLY generate questions and answers derived exclusively from the provided source text.
        - You MUST NOT invent information, use external knowledge, or make assumptions.
        - If the source text lacks enough information to generate ${numQuestions} questions, ONLY generate as many questions as the text strictly supports (even if it's less than requested, or 0).
        - Every answer must be directly traceable to facts in the uploaded document.

        **Instructions:**
        1. Attempt to create ${numQuestions} questions if the text allows it.
        2. Difficulty: ${difficulty}.
        ${typeInstruction}
        4. Return ONLY valid JSON.
        ${customPromptInstruction}
        **Source Text:**
        ---
        ${sourceText}
        ---
    `;
}

export async function generateQuizFromText(
  sourceText: string,
  numQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard',
  language: Language,
  questionType: QuestionType,
  customPrompt?: string
): Promise<QuizData> {
  const startTime = performance.now();
  const wordCount = sourceText.split(/\s+/).filter(Boolean).length;

  const prompt = getPrompt(sourceText, numQuestions, difficulty, language, questionType, customPrompt);
  const schema = getQuizSchema(language, questionType);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1,
      },
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No content generated");
    
    const quiz: Quiz = JSON.parse(jsonText);
    
    if (quiz.questions.length === 0) {
      throw new Error("The uploaded document does not contain enough extractable information to generate any questions based on the strict accuracy rules. Please upload a more detailed document.");
    }
    
    if (questionType === 'true_false') {
        const trueVal = language === 'ar' ? 'صح' : 'True';
        const falseVal = language === 'ar' ? 'خطأ' : 'False';
        quiz.questions.forEach(q => {
            q.options = [trueVal, falseVal];
        });
    }

    const endTime = performance.now();
    const processingTime = (endTime - startTime) / 1000;

    return {
      quiz,
      stats: {
        totalQuestions: quiz.questions.length,
        extractedWords: wordCount,
        processingTime: processingTime,
      },
    };
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz. Please try again.");
  }
}
