import { requireAuthWithProfile } from "@/services/auth.service";
import { getUserGradeData } from "@/services/grade.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, User, Hash, Award, BookOpen, Code } from "lucide-react";

export default async function GradesPage() {
  const { user } = await requireAuthWithProfile();
  const gradeData = await getUserGradeData(user.id);

  const networksGrade = gradeData?.subjects.find(s => s.subject_slug === "networks");
  const jsGrade = gradeData?.subjects.find(s => s.subject_slug === "javascript");

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-amber-400" />
          </div>
          Your Grades
        </h1>
        <p className="text-zinc-400 text-sm mt-2 ml-[52px]">
          View your linked grade records
        </p>
      </div>

      {gradeData ? (
        <div className="space-y-6">
          {/* Identity Card */}
          <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Student Name</p>
                    <p className="text-xl font-semibold text-white break-words" dir="auto">
                      {gradeData.canonical_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                    <Hash className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Student Code</p>
                    <p className="text-xl font-mono font-semibold text-white">
                      {gradeData.student_code}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Networks Card */}
            <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden flex flex-col h-full">
              <div className="h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardHeader className="pb-4 pt-6">
                <CardTitle className="text-lg text-zinc-200 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-amber-400" />
                  Networks
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                {networksGrade ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">Total Grade</p>
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-center mb-2">
                      <p className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                        {networksGrade.grade_part_1 ?? "N/A"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-400 text-sm">No grades recorded for Networks yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* JavaScript Card */}
            <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden flex flex-col h-full">
              <div className="h-1.5 bg-gradient-to-r from-yellow-400 to-yellow-600" />
              <CardHeader className="pb-4 pt-6">
                <CardTitle className="text-lg text-zinc-200 flex items-center gap-2">
                  <Code className="h-5 w-5 text-yellow-400" />
                  JavaScript
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-center">
                {jsGrade ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/40 border border-zinc-800">
                      <span className="text-sm font-medium text-zinc-400">Oral</span>
                      <span className="text-2xl font-bold text-yellow-400">
                        {jsGrade.grade_part_1 ?? "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/40 border border-zinc-800">
                      <span className="text-sm font-medium text-zinc-400">Midterm</span>
                      <span className="text-2xl font-bold text-yellow-400">
                        {jsGrade.grade_part_2 ?? "N/A"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-400 text-sm">No grades recorded for JavaScript yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Empty state — no code linked */
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-zinc-800/60 border border-zinc-700 flex items-center justify-center mb-4">
              <GraduationCap className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-300 mb-2">
              No code was attached to this account
            </h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              If you have a student code, you can link it during account registration.
              Contact your administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
