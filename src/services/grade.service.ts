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
    .select("subject_id, grade_part_1, grade_part_2, grade_part_3, grade_part_4, grade_subjects(slug, name)")
    .eq("student_code", link.student_code);

  if (gradesError) return null;

  // Gracefully fetch setting (if table not migrated yet, it won't crash)
  let showAverages = false;
  try {
    const { getSystemSetting } = await import("@/services/admin.service");
    const val = await getSystemSetting("show_class_averages");
    showAverages = val === "true" || val === true;
  } catch (e) {
    // Ignore
  }

  let averagesMap = new Map();
  if (showAverages) {
    try {
      const { data: averages } = await supabase.rpc("get_subject_averages");
      if (averages) {
        averagesMap = new Map(averages.map((a: any) => [a.subject_id, a]));
      }
    } catch (e) {
      // Ignore
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subjects = (grades || []).map((g: any) => {
    const avg = averagesMap.get(g.subject_id);
    return {
      subject_slug: g.grade_subjects.slug,
      subject_name: g.grade_subjects.name,
      grade_part_1: g.grade_part_1,
      grade_part_2: g.grade_part_2,
      grade_part_3: g.grade_part_3,
      grade_part_4: g.grade_part_4,
      avg_part_1: avg ? avg.avg_part_1 : null,
      avg_part_2: avg ? avg.avg_part_2 : null,
      avg_part_3: avg ? avg.avg_part_3 : null,
      avg_part_4: avg ? avg.avg_part_4 : null,
    };
  });

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
export async function importGradesCsv(csvContent: string, subjectName: string): Promise<CsvImportResult> {
  const adminClient = createAdminClient();
  const result: CsvImportResult = { totalRows: 0, imported: 0, skipped: 0, errors: [] };

  const parsedName = subjectName.trim();
  if (!parsedName) {
    result.errors.push("Subject name is required");
    return result;
  }
  
  const subjectSlug = parsedName.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-').replace(/^-|-$/g, '');

  // Parse CSV lines robustly (handles quotes and newlines)
  const lines = csvContent.split(/\r?\n/);
  const rows: string[][] = [];
  let insideQuote = false;
  let currentRow: string[] = [];
  let currentEntry = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        currentRow.push(currentEntry.trim());
        currentEntry = '';
      } else {
        currentEntry += char;
      }
    }
    
    if (!insideQuote) {
      currentRow.push(currentEntry.trim());
      if (currentRow.some(col => col.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentEntry = '';
    } else {
      currentEntry += '\\n'; // Embed newline if inside quote across lines
    }
  }

  if (rows.length < 2) {
    result.errors.push("CSV file is empty or has no data rows");
    return result;
  }

  // Get or insert the subject
  let { data: subject, error: subjectError } = await adminClient
    .from("grade_subjects")
    .select("id")
    .eq("slug", subjectSlug)
    .single();

  if (subjectError || !subject) {
    // Attempt to create it
    const { data: newSubject, error: insertError } = await adminClient
      .from("grade_subjects")
      .insert({ slug: subjectSlug, name: parsedName })
      .select("id")
      .single();
      
    if (insertError || !newSubject) {
      result.errors.push(`Failed to create subject ${parsedName}: ${insertError?.message}`);
      return result;
    }
    subject = newSubject;
  }
  const subjectId = subject.id;

  let startIndex = 0;
  const headerRow = rows[0].join(" ").toLowerCase();
  if (
    headerRow.includes("كود") ||
    headerRow.includes("code") ||
    headerRow.includes("اسم") ||
    headerRow.includes("name")
  ) {
    startIndex = 1;
  }

  if (startIndex < rows.length) {
    const nextRow = rows[startIndex].join(" ").toLowerCase();
    if (nextRow.startsWith("الفصل") || nextRow.match(/^\d+["']?\s*$/)) {
      startIndex++;
    }
  }

  const dataRows = rows.slice(startIndex);
  result.totalRows = dataRows.length;

  for (let i = 0; i < dataRows.length; i++) {
    const parts = dataRows[i];
    
    if (parts.length < 2) {
      result.errors.push(`Row ${i + 1}: Invalid format`);
      result.skipped++;
      continue;
    }

    const code = parts[0].replace(/^["']+|["']+$/g, "").trim();
    const name = parts[1].replace(/^["']+|["']+$/g, "").trim();

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

    // Oral, Midterm, Practical, Coursework
    const gradePart1 = parts.length >= 3 && parts[2].trim() ? parts[2].trim() : "(لم تظهر بعد)";
    const gradePart2 = parts.length >= 4 && parts[3].trim() ? parts[3].trim() : "(لم تظهر بعد)";
    const gradePart3 = parts.length >= 5 && parts[4].trim() ? parts[4].trim() : "(لم تظهر بعد)";
    const gradePart4 = parts.length >= 6 && parts[5].trim() ? parts[5].trim() : "(لم تظهر بعد)";

    // Upsert Student (DO NOTHING if exists, so canonical name is preserved)
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
        grade_part_2: gradePart2,
        grade_part_3: gradePart3,
        grade_part_4: gradePart4
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

/**
 * Get all subjects. Admin-only.
 */
export async function getAllSubjects() {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("grade_subjects")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Delete a subject. Admin-only.
 */
export async function deleteSubject(subjectId: string) {
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("grade_subjects")
    .delete()
    .eq("id", subjectId);

  if (error) throw new Error(error.message);
  return true;
}
