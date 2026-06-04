"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AnalyticsDashboardData,
  AnalyticsOverview,
  StudentRanking,
  SubjectAnalytics,
  GradeDistributionBucket,
} from "@/lib/types";

/**
 * Parse a grade part string into a number, returning null if non-numeric.
 * Handles Arabic absence markers (غ), unreleased markers, empty strings, etc.
 */
function parseGradeValue(val: string | null | undefined): number | null {
  if (!val || val.trim() === "") return null;
  const trimmed = val.trim();
  // Check if the string is numeric (integer or decimal)
  if (/^[0-9]+\.?[0-9]*$/.test(trimmed) || /^\.[0-9]+$/.test(trimmed)) {
    return parseFloat(trimmed);
  }
  return null;
}

/**
 * Sum all numeric grade parts (1–4) for a single grade record.
 */
function sumGradeParts(record: {
  grade_part_1: string | null;
  grade_part_2: string | null;
  grade_part_3: string | null;
  grade_part_4: string | null;
}): number {
  let sum = 0;
  const p1 = parseGradeValue(record.grade_part_1);
  const p2 = parseGradeValue(record.grade_part_2);
  const p3 = parseGradeValue(record.grade_part_3);
  const p4 = parseGradeValue(record.grade_part_4);
  if (p1 !== null) sum += p1;
  if (p2 !== null) sum += p2;
  if (p3 !== null) sum += p3;
  if (p4 !== null) sum += p4;
  return sum;
}

/**
 * Get all analytics dashboard data in one call.
 * Uses the admin client to bypass RLS for full data access.
 */
export async function getAnalyticsDashboardData(): Promise<AnalyticsDashboardData> {
  const adminClient = createAdminClient();

  // Fetch all students
  const { data: students, error: studentsError } = await adminClient
    .from("students")
    .select("student_code, canonical_name");

  if (studentsError) throw new Error(`Failed to fetch students: ${studentsError.message}`);

  // Fetch all grade records with joined subject info
  const { data: gradeRecords, error: gradesError } = await adminClient
    .from("subject_grade_records")
    .select("subject_id, student_code, grade_part_1, grade_part_2, grade_part_3, grade_part_4, grade_subjects(id, slug, name)");

  if (gradesError) throw new Error(`Failed to fetch grades: ${gradesError.message}`);

  const allStudents = students || [];
  const rawRecords = (gradeRecords || []) as unknown[];
  const allGrades = (rawRecords.map((item) => {
    const g = item as Record<string, unknown>;
    const subjRaw = g.grade_subjects;
    const subj = Array.isArray(subjRaw) ? subjRaw[0] : subjRaw;
    const subjObj = subj as Record<string, unknown> | null | undefined;
    return {
      subject_id: String(g.subject_id),
      student_code: String(g.student_code),
      grade_part_1: g.grade_part_1 as string | null,
      grade_part_2: g.grade_part_2 as string | null,
      grade_part_3: g.grade_part_3 as string | null,
      grade_part_4: g.grade_part_4 as string | null,
      grade_subjects: subjObj ? {
        id: String(subjObj.id),
        slug: String(subjObj.slug),
        name: String(subjObj.name),
      } : null,
    };
  }).filter((g) => g.grade_subjects !== null) as Array<{
    subject_id: string;
    student_code: string;
    grade_part_1: string | null;
    grade_part_2: string | null;
    grade_part_3: string | null;
    grade_part_4: string | null;
    grade_subjects: { id: string; slug: string; name: string };
  }>);

  // Build student name map
  const studentNameMap = new Map<string, string>();
  for (const s of allStudents) {
    studentNameMap.set(s.student_code, s.canonical_name);
  }

  // ─── Per-student aggregation ───────────────────────────────
  const studentTotals = new Map<string, { total: number; count: number }>();
  for (const g of allGrades) {
    const score = sumGradeParts(g);
    const existing = studentTotals.get(g.student_code);
    if (existing) {
      existing.total += score;
      existing.count += 1;
    } else {
      studentTotals.set(g.student_code, { total: score, count: 1 });
    }
  }

  // Build rankings array (only students that have at least one grade)
  const rankingsUnsorted: StudentRanking[] = [];
  for (const [code, agg] of studentTotals) {
    rankingsUnsorted.push({
      studentCode: code,
      studentName: studentNameMap.get(code) || code,
      totalScore: Math.round(agg.total * 100) / 100,
      averageScore: agg.count > 0 ? Math.round((agg.total / agg.count) * 100) / 100 : 0,
      subjectCount: agg.count,
      rank: 0, // will be filled below
    });
  }

  // Sort by total score descending, then by name for tie-breaking display
  rankingsUnsorted.sort((a, b) => b.totalScore - a.totalScore || a.studentName.localeCompare(b.studentName));

  // Dense ranking: same score → same rank
  let currentRank = 0;
  let prevScore = -Infinity;
  for (const r of rankingsUnsorted) {
    if (r.totalScore !== prevScore) {
      currentRank++;
      prevScore = r.totalScore;
    }
    r.rank = currentRank;
  }

  const rankings = rankingsUnsorted;

  // ─── Overall statistics ────────────────────────────────────
  const totalStudents = allStudents.length;
  const totalGradesRecorded = allGrades.length;

  // Collect unique subjects
  const subjectMap = new Map<string, { id: string; slug: string; name: string }>();
  for (const g of allGrades) {
    if (g.grade_subjects && !subjectMap.has(g.grade_subjects.id)) {
      subjectMap.set(g.grade_subjects.id, g.grade_subjects);
    }
  }
  const totalSubjects = subjectMap.size;

  let averageScore = 0;
  let highestTotal = 0;
  let lowestTotal = Infinity;
  let highestTotalStudentName = "";
  let lowestTotalStudentName = "";

  if (rankings.length > 0) {
    const totalOfAllTotals = rankings.reduce((sum, r) => sum + r.totalScore, 0);
    averageScore = Math.round((totalOfAllTotals / rankings.length) * 100) / 100;
    highestTotal = rankings[0].totalScore;
    highestTotalStudentName = rankings[0].studentName;
    const last = rankings[rankings.length - 1];
    lowestTotal = last.totalScore;
    lowestTotalStudentName = last.studentName;
  } else {
    lowestTotal = 0;
  }

  const overview: AnalyticsOverview = {
    totalStudents,
    totalGradesRecorded,
    totalSubjects,
    averageScore,
    highestTotal,
    lowestTotal,
    highestTotalStudentName,
    lowestTotalStudentName,
  };

  // ─── Per-subject analytics ─────────────────────────────────
  const subjectGrades = new Map<string, typeof allGrades>();
  for (const g of allGrades) {
    const sid = g.subject_id;
    if (!subjectGrades.has(sid)) subjectGrades.set(sid, []);
    subjectGrades.get(sid)!.push(g);
  }

  const subjectStats: SubjectAnalytics[] = [];
  for (const [subjectId, grades] of subjectGrades) {
    const info = subjectMap.get(subjectId);
    if (!info) continue;

    const totals = grades.map(sumGradeParts);
    const studentCount = grades.length;
    const avgTotal = studentCount > 0 ? Math.round((totals.reduce((a, b) => a + b, 0) / studentCount) * 100) / 100 : 0;
    const highestSubjectTotal = Math.max(...totals);
    const lowestSubjectTotal = Math.min(...totals);

    // Per-part averages
    const partAvg = (partKey: "grade_part_1" | "grade_part_2" | "grade_part_3" | "grade_part_4") => {
      const numericValues = grades.map((g) => parseGradeValue(g[partKey])).filter((v): v is number => v !== null);
      if (numericValues.length === 0) return null;
      return Math.round((numericValues.reduce((a, b) => a + b, 0) / numericValues.length) * 100) / 100;
    };

    subjectStats.push({
      subjectId,
      subjectName: info.name,
      subjectSlug: info.slug,
      studentCount,
      averageTotal: avgTotal,
      highestTotal: highestSubjectTotal,
      lowestTotal: lowestSubjectTotal,
      avgPart1: partAvg("grade_part_1"),
      avgPart2: partAvg("grade_part_2"),
      avgPart3: partAvg("grade_part_3"),
      avgPart4: partAvg("grade_part_4"),
    });
  }

  subjectStats.sort((a, b) => a.subjectName.localeCompare(b.subjectName));

  // ─── Grade distribution buckets ────────────────────────────
  // Divide students into quartile buckets by their total score relative to the max observed
  const maxPossible = highestTotal > 0 ? highestTotal : 1;
  const buckets: GradeDistributionBucket[] = [
    { label: "Excellent (75-100%)", count: 0, color: "#22c55e" },
    { label: "Good (50-75%)", count: 0, color: "#3b82f6" },
    { label: "Fair (25-50%)", count: 0, color: "#f59e0b" },
    { label: "Needs Improvement (0-25%)", count: 0, color: "#ef4444" },
  ];

  for (const r of rankings) {
    const pct = (r.totalScore / maxPossible) * 100;
    if (pct >= 75) buckets[0].count++;
    else if (pct >= 50) buckets[1].count++;
    else if (pct >= 25) buckets[2].count++;
    else buckets[3].count++;
  }

  return {
    overview,
    rankings,
    subjectStats,
    gradeDistribution: buckets,
  };
}
