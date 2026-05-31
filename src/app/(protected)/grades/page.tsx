import { requireAuthWithProfile } from "@/services/auth.service";
import { getUserGradeData } from "@/services/grade.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, User, Hash, Award, BookOpen, Code } from "lucide-react";

export default async function GradesPage() {
  const { user } = await requireAuthWithProfile();
  const gradeData = await getUserGradeData(user.id);



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
            {gradeData.subjects.map((subject, index) => (
              <Card key={index} className="border-zinc-800 bg-zinc-900/50 overflow-hidden flex flex-col h-full">
                <div className={`h-1.5 ${index % 2 === 0 ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-emerald-400 to-emerald-600"}`} />
                <CardHeader className="pb-4 pt-6">
                  <CardTitle className="text-lg text-zinc-200 flex items-center gap-2">
                    <BookOpen className={`h-5 w-5 ${index % 2 === 0 ? "text-amber-400" : "text-emerald-400"}`} />
                    {subject.subject_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 border border-zinc-800">
                      <span className="text-sm font-medium text-zinc-400">Oral</span>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${index % 2 === 0 ? "text-amber-400" : "text-emerald-400"}`}>
                          {subject.grade_part_1 || "N/A"}
                        </div>
                        {subject.avg_part_1 != null && subject.grade_part_1 !== "(لم تظهر بعد)" && (
                          <div className="text-xs text-zinc-500 mt-0.5">(Avg: {subject.avg_part_1})</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 border border-zinc-800">
                      <span className="text-sm font-medium text-zinc-400">Midterm</span>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${index % 2 === 0 ? "text-amber-400" : "text-emerald-400"}`}>
                          {subject.grade_part_2 || "N/A"}
                        </div>
                        {subject.avg_part_2 != null && subject.grade_part_2 !== "(لم تظهر بعد)" && (
                          <div className="text-xs text-zinc-500 mt-0.5">(Avg: {subject.avg_part_2})</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 border border-zinc-800">
                      <span className="text-sm font-medium text-zinc-400">Practical</span>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${index % 2 === 0 ? "text-amber-400" : "text-emerald-400"}`}>
                          {subject.grade_part_3 || "N/A"}
                        </div>
                        {subject.avg_part_3 != null && subject.grade_part_3 !== "(لم تظهر بعد)" && (
                          <div className="text-xs text-zinc-500 mt-0.5">(Avg: {subject.avg_part_3})</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/40 border border-zinc-800">
                      <span className="text-sm font-medium text-zinc-400">Coursework</span>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${index % 2 === 0 ? "text-amber-400" : "text-emerald-400"}`}>
                          {subject.grade_part_4 || "N/A"}
                        </div>
                        {subject.avg_part_4 != null && subject.grade_part_4 !== "(لم تظهر بعد)" && (
                          <div className="text-xs text-zinc-500 mt-0.5">(Avg: {subject.avg_part_4})</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {gradeData.subjects.length === 0 && (
              <div className="col-span-full text-center py-8">
                <Award className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">No grades recorded for any subject yet.</p>
              </div>
            )}
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
