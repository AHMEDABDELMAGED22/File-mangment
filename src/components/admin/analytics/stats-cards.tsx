import { Card, CardContent } from "@/components/ui/card";
import { Users, BookOpen, TrendingUp, Trophy, TrendingDown, Layers } from "lucide-react";
import type { AnalyticsOverview } from "@/lib/types";

interface StatsCardsProps {
  overview: AnalyticsOverview;
}

const stats = (o: AnalyticsOverview) => [
  {
    label: "Total Students",
    value: o.totalStudents,
    icon: Users,
    iconBg: "bg-violet-500/10 border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    label: "Grades Recorded",
    value: o.totalGradesRecorded,
    icon: BookOpen,
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    label: "Total Subjects",
    value: o.totalSubjects,
    icon: Layers,
    iconBg: "bg-cyan-500/10 border-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    label: "Average Score",
    value: o.averageScore,
    icon: TrendingUp,
    iconBg: "bg-amber-500/10 border-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    label: "Highest Total",
    value: o.highestTotal,
    subtitle: o.highestTotalStudentName,
    icon: Trophy,
    iconBg: "bg-yellow-500/10 border-yellow-500/20",
    iconColor: "text-yellow-400",
  },
  {
    label: "Lowest Total",
    value: o.lowestTotal,
    subtitle: o.lowestTotalStudentName,
    icon: TrendingDown,
    iconBg: "bg-rose-500/10 border-rose-500/20",
    iconColor: "text-rose-400",
  },
];

export function StatsCards({ overview }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {stats(overview).map((stat) => (
        <Card key={stat.label} className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900/70 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${stat.iconBg} border flex items-center justify-center shrink-0`}>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-zinc-500">{stat.label}</p>
              {stat.subtitle && (
                <p className="text-[10px] text-zinc-600 truncate max-w-[160px]" dir="auto" title={stat.subtitle}>
                  {stat.subtitle}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
