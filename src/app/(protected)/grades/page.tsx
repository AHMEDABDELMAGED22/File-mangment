import { requireAuthWithProfile } from "@/services/auth.service";
import { getUserGradeData } from "@/services/grade.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, User, Hash, Award, BookOpen } from "lucide-react";

export default async function GradesPage() {
  const { user } = await requireAuthWithProfile();
  const gradeData = await getUserGradeData(user.id);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-amber-400" />
          </div>
          Your Grades
        </h1>
        <p className="text-zinc-400 text-sm mt-2 ml-[52px]">
          View your linked grade record
        </p>
        <div className="ml-[52px] mt-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
          <BookOpen className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-semibold tracking-wide text-amber-300">
            Network - Mid term grades
          </span>
        </div>
      </div>

      {gradeData ? (
        /* Grade card — shown when the user has a linked code */
        <Card className="border-zinc-800 bg-zinc-900/50 overflow-hidden">
          {/* Decorative gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
          <CardHeader className="pb-2 pt-6">
            <CardTitle className="text-lg text-zinc-200 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-400" />
              Grade Record
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pb-8">
            {/* Student Name */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Student Name</p>
                <p className="text-lg font-semibold text-white break-words" dir="auto">
                  {gradeData.student_name}
                </p>
              </div>
            </div>

            {/* Student Code */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-sky-500/20 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <Hash className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Student Code</p>
                <p className="text-lg font-mono font-semibold text-white">
                  {gradeData.student_code}
                </p>
              </div>
            </div>

            {/* Grade */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Grade</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  {gradeData.grade_value !== null && gradeData.grade_value !== undefined
                    ? gradeData.grade_value
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
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
