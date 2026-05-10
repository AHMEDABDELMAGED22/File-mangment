"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserGradeData } from "@/lib/types";

/**
 * Get the grade data linked to the current authenticated user.
 * Returns null if the user has no linked code.
 */
export async function getUserGradeData(userId: string): Promise<UserGradeData | null> {
  const supabase = await createClient();

  // First, get the user's linked student code
  const { data: link, error: linkError } = await supabase
    .from("user_grade_links")
    .select("student_code")
    .eq("user_id", userId)
    .single();

  if (linkError || !link) return null;

  // Then, get the student's canonical record
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("student_code, canonical_name")
    .eq("student_code", link.student_code)
    .single();

  if (studentError || !student) return null;

  // Then, get all their subject grades
  const { data: grades, error: gradesError } = await supabase
    .from("subject_grade_records")
    .select("grade_part_1, grade_part_2, grade_subjects(slug, name)")
    .eq("student_code", link.student_code);

  if (gradesError) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subjects = (grades || []).map((g: any) => ({
    subject_slug: g.grade_subjects.slug,
    subject_name: g.grade_subjects.name,
    grade_part_1: g.grade_part_1,
    grade_part_2: g.grade_part_2,
  }));

  return {
    student_code: student.student_code,
    canonical_name: student.canonical_name,
    subjects,
  };
}

/**
 * Claim a student code for a user (called during signup).
 * Uses the atomic database function to prevent race conditions.
 */
export async function claimStudentCode(
  userId: string,
  studentCode: string
): Promise<{ success: boolean; error?: string }> {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.rpc("claim_student_code", {
    p_user_id: userId,
    p_student_code: studentCode.trim(),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as { success: boolean; error?: string };
  return result;
}

export interface CsvImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: string[];
}

/**
 * Import CSV grade data into the subject_grade_records table.
 * Admin-only operation using the service role client.
 */
export async function importGradesCsv(csvContent: string, subjectSlug: "networks" | "javascript"): Promise<CsvImportResult> {
  const adminClient = createAdminClient();
  const result: CsvImportResult = { totalRows: 0, imported: 0, skipped: 0, errors: [] };

  // Parse CSV lines
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    result.errors.push("CSV file is empty or has no data rows");
    return result;
  }

  // Get the subject ID
  const { data: subject, error: subjectError } = await adminClient
    .from("grade_subjects")
    .select("id")
    .eq("slug", subjectSlug)
    .single();

  if (subjectError || !subject) {
    result.errors.push(`Subject ${subjectSlug} not found in database.`);
    return result;
  }
  const subjectId = subject.id;

  const headerLine = lines[0].toLowerCase();
  let startIndex = 0;
  if (
    headerLine.includes("كود") ||
    headerLine.includes("code") ||
    headerLine.includes("اسم") ||
    headerLine.includes("name")
  ) {
    startIndex = 1;
  }

  if (startIndex < lines.length) {
    const nextLine = lines[startIndex].toLowerCase();
    if (nextLine.startsWith("الفصل") || nextLine.match(/^\d+["']?\s*$/)) {
      startIndex++;
    }
  }
  if (startIndex < lines.length) {
    const nextLine = lines[startIndex].trim();
    if (nextLine.match(/^\d+["']*$/)) {
      startIndex++;
    }
  }

  const dataLines = lines.slice(startIndex);
  result.totalRows = dataLines.length;

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const parts = line.split(",");
    
    if (parts.length < 2) {
      result.errors.push(`Row ${i + 1}: Invalid format`);
      result.skipped++;
      continue;
    }

    const code = parts[0].trim();
    const name = parts[1].trim();

    if (!code) {
      result.errors.push(`Row ${i + 1}: Missing student code`);
      result.skipped++;
      continue;
    }

    if (!name) {
      result.errors.push(`Row ${i + 1}: Missing student name`);
      result.skipped++;
      continue;
    }

    let gradePart1: number | null = null;
    let gradePart2: number | null = null;

    if (subjectSlug === "networks") {
      const gradeStr = parts.length >= 3 ? parts[2].trim() : "";
      gradePart1 = gradeStr ? parseFloat(gradeStr) : null;
      if (gradeStr && isNaN(gradePart1 as number)) {
        result.errors.push(`Row ${i + 1}: Invalid grade value "${gradeStr}"`);
        result.skipped++;
        continue;
      }
    } else if (subjectSlug === "javascript") {
      const g1Str = parts.length >= 3 ? parts[2].trim() : "";
      const g2Str = parts.length >= 4 ? parts[3].trim() : "";
      
      gradePart1 = g1Str ? parseFloat(g1Str) : null;
      if (g1Str && isNaN(gradePart1 as number)) {
        result.errors.push(`Row ${i + 1}: Invalid oral grade "${g1Str}"`);
        result.skipped++;
        continue;
      }
      
      gradePart2 = g2Str ? parseFloat(g2Str) : null;
      if (g2Str && isNaN(gradePart2 as number)) {
        result.errors.push(`Row ${i + 1}: Invalid midterm grade "${g2Str}"`);
        result.skipped++;
        continue;
      }
    }

    // Upsert Student (DO NOTHING if exists, so Networks canonical name is preserved)
    const { error: studentError } = await adminClient
      .from("students")
      .upsert({ student_code: code, canonical_name: name }, { onConflict: "student_code", ignoreDuplicates: true });
      
    if (studentError) {
      result.errors.push(`Row ${i + 1}: Failed to save student - ${studentError.message}`);
      result.skipped++;
      continue;
    }

    // Upsert Grade Record
    const { error: gradeError } = await adminClient
      .from("subject_grade_records")
      .upsert({
        subject_id: subjectId,
        student_code: code,
        grade_part_1: gradePart1,
        grade_part_2: gradePart2
      }, { onConflict: "subject_id,student_code" });

    if (gradeError) {
      result.errors.push(`Row ${i + 1}: Failed to save grades - ${gradeError.message}`);
      result.skipped++;
    } else {
      result.imported++;
    }
  }

  return result;
}

/**
 * Get all grade records with their claim status. Admin-only.
 */
export async function getAllGradeRecords() {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("students")
    .select("*, subject_grade_records(*, grade_subjects(slug)), user_grade_links(user_id)")
    .order("canonical_name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
