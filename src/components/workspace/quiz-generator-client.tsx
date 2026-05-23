"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { generateQuiz, QuizGenerationPayload } from "@/actions/quiz.actions";
import { extractTextFromPdf } from "@/services/pdfExtractorService";
import type { QuizData, Language, QuestionType, Question } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, FileText, Trash2, UploadCloud, File as FileIcon, Clock, CheckCircle2, XCircle, BrainCircuit, Loader2 } from "lucide-react";
import { toast } from "sonner";

type AppState = "upload" | "processing" | "results" | "quiz" | "error";

// Simple language detector
function detectLanguage(text: string): Language {
  const arabicRegex = /[\u0600-\u06FF]/;
  if (arabicRegex.test(text)) {
    return "ar";
  }
  return "en";
}

export function QuizGeneratorClient() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [sourceText, setSourceText] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState<Language>("unknown");
  const [selectedLanguage, setSelectedLanguage] = useState<"auto" | "en" | "ar">("auto");
  const [numQuestions, setNumQuestions] = useState<number | "">(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [timeLimit, setTimeLimit] = useState<number | "">(10); // in minutes
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [customPrompt, setCustomPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // File processing
  const processFiles = useCallback((incomingFiles: FileList | null) => {
    if (!incomingFiles) return;

    const newFiles = Array.from(incomingFiles);
    const validFiles: File[] = [];
    let errorMessages: string[] = [];

    newFiles.forEach((file) => {
      if (file.type !== "application/pdf") {
        errorMessages.push(`'${file.name}' is not a PDF.`);
      } else if (file.size > 5 * 1024 * 1024) {
        errorMessages.push(`'${file.name}' is larger than 5MB.`);
      } else {
        validFiles.push(file);
      }
    });

    if (errorMessages.length > 0) {
      toast.error(errorMessages.join(" "));
    }

    setFiles((prevFiles) => {
      const existingFileNames = new Set(prevFiles.map((f) => f.name));
      const uniqueNewFiles = validFiles.filter((f) => !existingFileNames.has(f.name));
      return [...prevFiles, ...uniqueNewFiles];
    });
  }, []);

  useEffect(() => {
    const extractAllText = async () => {
      if (files.length === 0) {
        setSourceText("");
        setDetectedLanguage("unknown");
        return;
      }

      setIsExtracting(true);
      setError(null);
      try {
        const textPromises = files.map((file) => extractTextFromPdf(file));
        const texts = await Promise.all(textPromises);
        const combinedText = texts.join("\n\n---\n\n");
        setSourceText(combinedText);
        setDetectedLanguage(detectLanguage(combinedText));
      } catch (err) {
        toast.error("Failed to extract text from one or more PDFs. Files might be corrupted or protected.");
        setSourceText("");
        setDetectedLanguage("unknown");
      } finally {
        setIsExtracting(false);
      }
    };
    extractAllText();
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
    const fileInput = document.getElementById("pdf-upload") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error("Please upload at least one PDF file to generate a quiz.");
      return;
    }
    if (isExtracting) {
      toast.error("Please wait for files to be processed.");
      return;
    }

    const finalLanguage = selectedLanguage === "auto" ? detectedLanguage : selectedLanguage;
    if (finalLanguage === "unknown") {
      toast.error("Could not determine the language. Please select a language manually.");
      return;
    }

    const payload: QuizGenerationPayload = {
      sourceText,
      numQuestions: Number(numQuestions) || 5,
      difficulty,
      timeLimit: (Number(timeLimit) || 10) * 60,
      language: finalLanguage,
      questionType,
      customPrompt,
    };

    setAppState("processing");
    setError(null);
    setQuizData(null);

    const result = await generateQuiz(payload);
    
    if (result.error || !result.data) {
      setError(result.error || "An unknown error occurred.");
      setAppState("error");
    } else {
      setQuizData(result.data);
      setAppState("results");
    }
  };

  const handleReset = () => {
    setAppState("upload");
    setQuizData(null);
    setError(null);
  };

  const languageOptions = [
    { value: "auto", label: `Auto-detect (${detectedLanguage !== "unknown" ? detectedLanguage.toUpperCase() : "N/A"})` },
    { value: "en", label: "English" },
    { value: "ar", label: "Arabic" },
  ];

  const difficultyOptions = [
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
  ];

  const questionTypeOptions = [
    { value: "mcq", label: "Multiple Choice" },
    { value: "true_false", label: "True / False" },
    { value: "mixed", label: "Mixed (MCQ + T/F)" },
    { value: "essay", label: "Essay / Open Ended" },
  ];

  // Render Upload View
  if (appState === "upload") {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center">
              <BrainCircuit className="h-5 w-5 text-violet-400" />
            </div>
            AI Quiz Generator
          </h1>
          <p className="text-zinc-400 text-sm mt-2">
            Upload course materials and generate practice quizzes instantly using Gemini AI.
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/50 shadow-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
          <form onSubmit={handleGenerateQuiz}>
            <CardContent className="p-6 sm:p-8 space-y-8">
              {/* File Dropzone */}
              <div
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl text-center transition-all duration-200
                ${isDragging ? "border-violet-500 bg-violet-500/10" : "border-zinc-700 hover:border-zinc-500 bg-zinc-950/50"}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {files.length > 0 ? (
                  <div className="w-full space-y-3">
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {files.map((file, index) => (
                        <div key={file.name} className="flex items-center justify-between bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <FileIcon className="w-5 h-5 text-violet-400 flex-shrink-0" />
                            <span className="font-medium text-sm text-zinc-200 truncate" title={file.name}>{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 rounded-md hover:bg-zinc-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {isExtracting && (
                      <div className="flex items-center justify-center gap-2 text-sm text-zinc-400 mt-2">
                        <Loader2 className="w-4 h-4 animate-spin text-violet-400" /> Processing files...
                      </div>
                    )}
                    <div className="pt-2">
                      <Button type="button" variant="outline" className="border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:text-white" onClick={() => document.getElementById("pdf-upload")?.click()}>
                        Add More Files
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-zinc-400 py-4">
                    <div className="p-4 rounded-full bg-zinc-900/80 border border-zinc-800 mb-2">
                      <UploadCloud className="w-8 h-8 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-zinc-200 text-lg">Drag & drop your PDFs here</p>
                      <p className="text-sm mt-1">or click to browse files</p>
                    </div>
                    <Button type="button" variant="secondary" className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white" onClick={() => document.getElementById("pdf-upload")?.click()}>
                      Browse Files
                    </Button>
                    <input type="file" id="pdf-upload" accept="application/pdf" onChange={handleFileChange} className="hidden" multiple />
                    <p className="text-xs mt-2 text-zinc-500">Max file size: 5MB per file</p>
                  </div>
                )}
              </div>

              {/* Settings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="space-y-3">
                  <Label htmlFor="num-questions" className="text-zinc-300 font-medium">Number of Questions</Label>
                  <Input
                    id="num-questions"
                    type="number"
                    value={numQuestions}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNumQuestions(val === "" ? "" : Math.max(1, parseInt(val, 10) || 1));
                    }}
                    min="1"
                    max="50"
                    className="w-full h-11 bg-zinc-950/50 border-zinc-800 text-white focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-all rounded-lg"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="difficulty" className="text-zinc-300 font-medium">Difficulty</Label>
                  <Select value={difficulty} onValueChange={(value) => setDifficulty(value as any)}>
                    <SelectTrigger id="difficulty" className="w-full h-11 bg-zinc-950/50 border-zinc-800 text-white focus:ring-2 focus:ring-violet-500/50 transition-all rounded-lg">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                      {difficultyOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="question-type" className="text-zinc-300 font-medium">Question Type</Label>
                  <Select value={questionType} onValueChange={(value) => setQuestionType(value as QuestionType)}>
                    <SelectTrigger id="question-type" className="w-full h-11 bg-zinc-950/50 border-zinc-800 text-white focus:ring-2 focus:ring-violet-500/50 transition-all rounded-lg">
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                      {questionTypeOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="language" className="text-zinc-300 font-medium">Language</Label>
                  <Select value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as any)}>
                    <SelectTrigger id="language" className="w-full h-11 bg-zinc-950/50 border-zinc-800 text-white focus:ring-2 focus:ring-violet-500/50 transition-all rounded-lg">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                      {languageOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="time-limit" className="text-zinc-300 font-medium">Time Limit (minutes)</Label>
                  <Input
                    id="time-limit"
                    type="number"
                    value={timeLimit}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTimeLimit(val === "" ? "" : Math.max(1, parseInt(val, 10) || 1));
                    }}
                    min="1"
                    className="w-full h-11 bg-zinc-950/50 border-zinc-800 text-white focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-all rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                <Label htmlFor="custom-prompt" className="text-zinc-300 font-medium">Custom Focus (Optional)</Label>
                <Textarea
                  id="custom-prompt"
                  placeholder="e.g., 'Focus on the historical dates mentioned in the text' or 'Generate questions about the main algorithms'"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full resize-none bg-zinc-950/50 border-zinc-800 text-white min-h-[100px] focus-visible:ring-2 focus-visible:ring-violet-500/50 transition-all rounded-lg"
                />
              </div>

            </CardContent>
            <CardFooter className="p-6 pt-0 sm:px-8 sm:pb-8">
              <Button
                type="submit"
                disabled={files.length === 0 || isExtracting}
                className="w-full text-base py-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium border-0 transition-all duration-300 shadow-lg shadow-violet-900/20"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Extracting PDFs...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="mr-2 h-5 w-5" /> Generate Quiz
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  if (appState === "processing") {
    return <ProcessingView />;
  }

  if (appState === "error") {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 text-center bg-red-950/20 rounded-xl shadow-xl border border-red-900/50 backdrop-blur-sm">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-red-400 mb-3">Oops! Something went wrong.</h2>
        <p className="text-red-300/80 mb-8">{error}</p>
        <Button onClick={handleReset} className="bg-red-600 hover:bg-red-700 text-white px-8">
          Try Again
        </Button>
      </div>
    );
  }

  if (appState === "results" && quizData) {
    return <ResultsView quizData={quizData} onStartQuiz={() => setAppState("quiz")} onReset={handleReset} />;
  }

  if (appState === "quiz" && quizData) {
    return <InteractiveQuiz quizData={quizData} onFinish={handleReset} />;
  }

  return null;
}

// ----------------------------------------------------------------------
// Processing View
// ----------------------------------------------------------------------
function ProcessingView() {
  const [status, setStatus] = useState("Analyzing input text...");
  const [step, setStep] = useState(0);

  const statuses = [
    "Analyzing input text...",
    "Communicating with AI...",
    "Crafting questions and options...",
    "Reviewing answer accuracy...",
    "Putting on the finishing touches!",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => {
        const nextStep = prev + 1;
        if (nextStep < statuses.length) {
          setStatus(statuses[nextStep]);
          return nextStep;
        }
        clearInterval(interval);
        return prev;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [statuses.length]);

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/50 rounded-2xl shadow-xl border border-zinc-800 max-w-lg mx-auto mt-12 backdrop-blur-sm">
      <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
        <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-t-4 border-violet-500 rounded-full animate-spin"></div>
        <BrainCircuit className="w-8 h-8 text-violet-400 animate-pulse" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">AI is making your quiz...</h2>
      <p className="text-zinc-400 text-lg transition-opacity duration-500 min-h-[28px]">
        {status}
      </p>
    </div>
  );
}

// ----------------------------------------------------------------------
// Results View
// ----------------------------------------------------------------------
function ResultsView({ quizData, onStartQuiz, onReset }: { quizData: QuizData; onStartQuiz: () => void; onReset: () => void }) {
  const { quiz, stats, timeLimit } = quizData;
  const hasTimeLimit = timeLimit && timeLimit > 0;

  const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
    <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 flex items-center gap-4">
      <div className="bg-violet-500/10 p-3 rounded-lg border border-violet-500/20">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        <p className="text-lg font-bold text-zinc-100">{value}</p>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-2xl border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <CardHeader className="text-center pt-10">
        <div className="mx-auto bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-full w-fit mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <CardTitle className="text-3xl font-bold text-white mb-2">Quiz Generated Successfully!</CardTitle>
        <CardDescription className="text-lg text-zinc-400">
          {quiz.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 px-8">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${hasTimeLimit ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
          <StatCard icon={<FileText className="w-5 h-5 text-violet-400"/>} label="Questions" value={stats.totalQuestions} />
          <StatCard icon={<FileIcon className="w-5 h-5 text-violet-400"/>} label="Source Words" value={stats.extractedWords} />
          {hasTimeLimit && <StatCard icon={<Clock className="w-5 h-5 text-violet-400"/>} label="Time Limit" value={`${timeLimit / 60} min`} />}
          <StatCard icon={<BrainCircuit className="w-5 h-5 text-violet-400"/>} label="Generation Time" value={`${stats.processingTime.toFixed(1)}s`} />
        </div>
        <div className="text-center pt-6 pb-2 border-t border-zinc-800/50">
          <h3 className="font-medium text-lg text-zinc-300">Ready to test your knowledge?</h3>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-4 px-8 pb-10">
        <Button onClick={onStartQuiz} className="w-full sm:w-auto flex-1 text-base py-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20">
          Start Quiz
        </Button>
        <Button onClick={onReset} variant="outline" className="w-full sm:w-auto flex-1 text-base py-6 bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
          Create Another
        </Button>
      </CardFooter>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Interactive Quiz
// ----------------------------------------------------------------------
function InteractiveQuiz({ quizData, onFinish }: { quizData: QuizData; onFinish: () => void }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quizData.timeLimit);
  
  const isRtl = useMemo(() => detectLanguage(quizData.quiz.title) === 'ar', [quizData.quiz.title]);

  useEffect(() => {
    if (typeof timeLeft !== 'number' || showResults) return;
    if (timeLeft <= 0) {
      setShowResults(true);
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prev) => (prev !== undefined ? prev - 1 : undefined));
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, showResults]);

  const formatTime = (seconds: number | undefined) => {
    if (typeof seconds !== 'number') return null;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const totalQuestions = quizData.quiz.questions.length;
  const currentQuestion = quizData.quiz.questions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const score = useMemo(() => {
    return quizData.quiz.questions.reduce((total, question, index) => {
      return selectedAnswers[index] === question.answer ? total + 1 : total;
    }, 0);
  }, [selectedAnswers, quizData.quiz.questions]);

  if (showResults) {
    return (
      <ResultsDetailView 
        questions={quizData.quiz.questions}
        selectedAnswers={selectedAnswers}
        score={score}
        onFinish={onFinish}
        isRtl={isRtl}
      />
    );
  }
  
  const selectedAnswer = selectedAnswers[currentQuestionIndex];
  const isEssay = currentQuestion.options.length === 0;

  return (
    <Card className="w-full max-w-3xl mx-auto border-zinc-800 bg-zinc-950/80 shadow-2xl backdrop-blur-xl overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="h-1 bg-zinc-800">
        <div 
          className="h-full bg-violet-500 transition-all duration-300" 
          style={{ width: `${((currentQuestionIndex) / totalQuestions) * 100}%` }}
        />
      </div>
      <CardHeader className="bg-zinc-900/50 border-b border-zinc-800 pb-6">
        <div className="flex justify-between items-center gap-4">
          <CardTitle className="text-xl text-white font-medium">{quizData.quiz.title}</CardTitle>
          <div className="flex items-center space-x-4 shrink-0">
            {timeLeft !== undefined && (
              <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md border ${timeLeft < 60 ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}`}>
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
            <div className="text-sm font-medium text-zinc-400 bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-700">
              {currentQuestionIndex + 1} / {totalQuestions}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-zinc-100 leading-relaxed">{currentQuestion.question}</h2>
        
        {isEssay ? (
           <div className="space-y-4">
             <Label className="text-zinc-400 text-sm">Your Answer (Internal Draft)</Label>
             <Textarea 
               className="min-h-[200px] bg-zinc-900 border-zinc-700 text-white resize-none p-4 text-base" 
               placeholder="Write your answer here... (This is for your own practice, it won't be auto-graded)"
               value={selectedAnswer || ""}
               onChange={(e) => handleAnswerSelect(e.target.value)}
             />
           </div>
        ) : (
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === option;
              return (
                <div 
                  key={index} 
                  onClick={() => handleAnswerSelect(option)}
                  className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                    ${isSelected 
                      ? 'border-violet-500 bg-violet-500/10 shadow-md' 
                      : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800/80 hover:border-zinc-700'
                    }`}
                >
                  <div className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full border shrink-0 transition-colors
                    ${isSelected ? 'border-violet-500 bg-violet-500' : 'border-zinc-600 bg-transparent'}`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <Label className="flex-1 text-base leading-snug cursor-pointer text-zinc-200 font-normal">
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-6 sm:p-8 bg-zinc-900/50 border-t border-zinc-800">
        <Button 
          onClick={handleNext} 
          disabled={!selectedAnswer && !isEssay} 
          className="w-full sm:w-auto sm:ml-auto text-base px-8 py-5 bg-white text-zinc-950 hover:bg-zinc-200"
        >
          {currentQuestionIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next Question'}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ----------------------------------------------------------------------
// Detailed Results View
// ----------------------------------------------------------------------
function ResultsDetailView({ 
  questions, selectedAnswers, score, onFinish, isRtl 
}: { 
  questions: Question[]; selectedAnswers: Record<number, string>; score: number; onFinish: () => void; isRtl: boolean;
}) {
  const totalQuestions = questions.length;
  // Calculate score ignoring essay questions since they can't be auto-graded
  const gradableQuestions = questions.filter(q => q.options.length > 0);
  const totalGradable = gradableQuestions.length;
  const percentage = totalGradable > 0 ? ((score / totalGradable) * 100).toFixed(0) : "100";

  return (
    <Card className="w-full max-w-4xl mx-auto border-zinc-800 bg-zinc-950/80 shadow-2xl backdrop-blur-xl" dir={isRtl ? 'rtl' : 'ltr'}>
      <CardHeader className="text-center pb-8 border-b border-zinc-800/50">
        <CardTitle className="text-3xl font-bold text-white mb-2">Quiz Complete!</CardTitle>
        <CardDescription className="text-lg text-zinc-400">Detailed Review</CardDescription>
        
        {totalGradable > 0 && (
          <div className="py-6 mt-4">
            <p className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-emerald-400 drop-shadow-sm">
              {percentage}%
            </p>
            <p className="text-lg text-zinc-400 mt-4 font-medium">
              You answered <span className="text-white">{score}</span> out of <span className="text-white">{totalGradable}</span> objective questions correctly.
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6 p-6 sm:p-8">
        {questions.map((question, index) => {
          const userAnswer = selectedAnswers[index];
          const isEssay = question.options.length === 0;
          const isCorrect = isEssay ? true : userAnswer === question.answer;

          return (
            <div key={index} className={`p-6 rounded-2xl border ${isRtl ? 'border-r-4' : 'border-l-4'} bg-zinc-900/50 
              ${isEssay ? 'border-l-blue-500 border-zinc-800' : isCorrect ? 'border-l-emerald-500 border-zinc-800' : 'border-l-red-500 border-zinc-800'}`}
            >
              <p className="text-lg font-semibold text-zinc-100 mb-5 leading-relaxed">{index + 1}. {question.question}</p>
              
              <div className="space-y-4">
                {isEssay ? (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                    <span className="font-semibold text-blue-400 block mb-2">Your Draft: </span>
                    <p className="text-zinc-300 whitespace-pre-wrap">{userAnswer || <span className="italic text-zinc-600">No answer provided</span>}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start gap-3 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                      {isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                      <div>
                        <span className="font-medium text-zinc-400">Your answer: </span>
                        <span className={`font-medium ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>{userAnswer || "No answer"}</span>
                      </div>
                    </div>
                    {!isCorrect && (
                      <div className="flex items-start gap-3 bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-emerald-500">Correct answer: </span>
                          <span className="font-medium text-emerald-100">{question.answer}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                <div className="mt-6 pt-4 border-t border-zinc-800">
                  <p className="font-semibold text-violet-400 mb-2">Explanation / Model Answer:</p>
                  <p className="text-zinc-300 leading-relaxed">{question.explanation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
      <CardFooter className="p-6 sm:p-8 bg-zinc-900/50 border-t border-zinc-800">
        <Button onClick={onFinish} className="w-full sm:w-auto mx-auto text-base px-10 py-6 bg-white text-zinc-950 hover:bg-zinc-200">
          Create Another Quiz
        </Button>
      </CardFooter>
    </Card>
  );
}
