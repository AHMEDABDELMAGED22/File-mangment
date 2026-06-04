import { requireAdmin } from "@/services/auth.service";
import { getAnalyticsDashboardAction } from "@/actions/analytics.actions";
import { StatsCards } from "@/components/admin/analytics/stats-cards";
import { LeaderboardTable } from "@/components/admin/analytics/leaderboard-table";
import { SubjectAnalyticsCards } from "@/components/admin/analytics/subject-analytics";
import { BarChart } from "@/components/admin/analytics/bar-chart";
import { DonutChart } from "@/components/admin/analytics/donut-chart";
import { SubjectBarChart } from "@/components/admin/analytics/subject-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, AlertCircle } from "lucide-react";

export default async function AnalyticsPage() {
  await requireAdmin();

  const result = await getAnalyticsDashboardAction();

  if (result.error || !result.data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md w-full flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-400 font-semibold mb-1">Failed to load analytics</h3>
            <p className="text-zinc-400 text-sm">{result.error || "An unexpected error occurred."}</p>
          </div>
        </div>
      </div>
    );
  }

  const { overview, rankings, subjectStats, gradeDistribution } = result.data;

  // Prepare data for Top 10 students bar chart
  const topStudentsData = rankings.slice(0, 10).map((r) => ({
    label: r.studentName,
    value: r.totalScore,
  }));

  // Prepare data for Subject Averages bar chart
  const subjectAveragesData = subjectStats.map((s) => ({
    label: s.subjectName,
    value: s.averageTotal,
  }));

  // Prepare data for Donut Chart (Grade Distribution)
  const donutChartData = gradeDistribution.map((b) => ({
    label: b.label,
    value: b.count,
    color: b.color,
  }));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
          <BarChart3 className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-zinc-400 text-sm">Overview of student academic performance and grades</p>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards overview={overview} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grade Distribution */}
        <Card className="border-zinc-800 bg-zinc-900/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-300">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pt-2">
            <DonutChart
              data={donutChartData}
              centerLabel="Students"
              centerValue={overview.totalStudents}
            />
          </CardContent>
        </Card>

        {/* Subject Averages */}
        <Card className="border-zinc-800 bg-zinc-900/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-300">Subject Averages</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <SubjectBarChart data={subjectAveragesData} />
          </CardContent>
        </Card>

        {/* Top Students */}
        <Card className="border-zinc-800 bg-zinc-900/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-300">Top 10 Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <BarChart data={topStudentsData} accentColor="#8b5cf6" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Data section: Leaderboard and Subject Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <LeaderboardTable rankings={rankings} />
        </div>
        <div className="space-y-6">
          <SubjectAnalyticsCards subjects={subjectStats} />
        </div>
      </div>
    </div>
  );
}
