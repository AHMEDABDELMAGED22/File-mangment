"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import type { SubjectAnalytics } from "@/lib/types";

interface SubjectAnalyticsProps {
  subjects: SubjectAnalytics[];
}

const PART_LABELS = ["Oral", "Midterm", "Practical", "Coursework"];

const SUBJECT_COLORS = [
  { bg: "from-violet-500/10 to-purple-500/10", border: "border-violet-500/20", accent: "text-violet-400", bar: "bg-violet-500" },
  { bg: "from-emerald-500/10 to-teal-500/10", border: "border-emerald-500/20", accent: "text-emerald-400", bar: "bg-emerald-500" },
  { bg: "from-amber-500/10 to-orange-500/10", border: "border-amber-500/20", accent: "text-amber-400", bar: "bg-amber-500" },
  { bg: "from-cyan-500/10 to-blue-500/10", border: "border-cyan-500/20", accent: "text-cyan-400", bar: "bg-cyan-500" },
  { bg: "from-rose-500/10 to-pink-500/10", border: "border-rose-500/20", accent: "text-rose-400", bar: "bg-rose-500" },
  { bg: "from-indigo-500/10 to-sky-500/10", border: "border-indigo-500/20", accent: "text-indigo-400", bar: "bg-indigo-500" },
];

export function SubjectAnalyticsCards({ subjects }: SubjectAnalyticsProps) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const visibleSubjects = selectedSubject
    ? subjects.filter((s) => s.subjectId === selectedSubject)
    : subjects;

  if (subjects.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardContent className="py-12 text-center">
          <BookOpen className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No subject data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-400" />
          Subject Analytics
        </h3>
        {subjects.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedSubject(null)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedSubject === null
                  ? "bg-zinc-700 text-white"
                  : "bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              All
            </button>
            {subjects.map((s) => (
              <button
                key={s.subjectId}
                onClick={() => setSelectedSubject(s.subjectId)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedSubject === s.subjectId
                    ? "bg-zinc-700 text-white"
                    : "bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                }`}
                dir="auto"
              >
                {s.subjectName}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleSubjects.map((subject, index) => {
          const colors = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
          const partAverages = [subject.avgPart1, subject.avgPart2, subject.avgPart3, subject.avgPart4];
          const maxPartAvg = Math.max(...partAverages.filter((v): v is number => v !== null), 1);

          return (
            <Card key={subject.subjectId} className="border-zinc-800 bg-zinc-900/50 overflow-hidden">
              <div className={`h-1 bg-gradient-to-r ${colors.bg}`} />
              <CardHeader className="pb-2 pt-4">
                <CardTitle className={`text-base font-semibold ${colors.accent} flex items-center gap-2`}>
                  <BookOpen className="h-4 w-4" />
                  <span dir="auto">{subject.subjectName}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pb-5">
                {/* Key metrics row */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-zinc-800/40 rounded-lg p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <Users className="h-3 w-3 text-zinc-500" />
                    </div>
                    <p className="text-lg font-bold text-white">{subject.studentCount}</p>
                    <p className="text-[10px] text-zinc-600">Students</p>
                  </div>
                  <div className="bg-zinc-800/40 rounded-lg p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <ArrowUp className="h-3 w-3 text-emerald-500" />
                    </div>
                    <p className="text-lg font-bold text-emerald-400">{subject.highestTotal}</p>
                    <p className="text-[10px] text-zinc-600">Highest</p>
                  </div>
                  <div className="bg-zinc-800/40 rounded-lg p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <ArrowDown className="h-3 w-3 text-rose-500" />
                    </div>
                    <p className="text-lg font-bold text-rose-400">{subject.lowestTotal}</p>
                    <p className="text-[10px] text-zinc-600">Lowest</p>
                  </div>
                </div>

                {/* Average with visual */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs text-zinc-500 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Subject Average
                  </span>
                  <span className={`text-sm font-bold ${colors.accent}`}>{subject.averageTotal}</span>
                </div>

                {/* Per-part breakdown */}
                <div className="space-y-2">
                  <p className="text-xs text-zinc-600 uppercase tracking-wider font-medium">Part Averages</p>
                  {partAverages.map((avg, pi) => (
                    <div key={pi} className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 w-20 shrink-0">{PART_LABELS[pi]}</span>
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        {avg !== null && (
                          <div
                            className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                            style={{ width: `${(avg / maxPartAvg) * 100}%`, opacity: 0.8 }}
                          />
                        )}
                      </div>
                      <span className="text-xs text-zinc-400 w-10 text-right tabular-nums">
                        {avg !== null ? avg : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
