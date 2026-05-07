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

  // Then, get the grade record
  const { data: grade, error: gradeError } = await supabase
    .from("grade_records")
    .select("student_code, student_name, grade_value")
    .eq("student_code", link.student_code)
    .single();

  if (gradeError || !grade) return null;

  return grade as UserGradeData;
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

  // The function returns JSON: { success: boolean, error?: string }
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
 * Import CSV grade data into the grade_records table.
 * Admin-only operation using the service role client.
 * Upserts on student_code to handle duplicates gracefully.
 */
export async function importGradesCsv(csvContent: string): Promise<CsvImportResult> {
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

  // Skip header row — detect and remove it
  // The header might be in Arabic (الكود,الاسم,...) or English (code,name,...)
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

  // Handle multi-line header (the original CSV has a line break in the header)
  // Check if line at startIndex looks like a continuation of header
  if (startIndex < lines.length) {
    const nextLine = lines[startIndex].toLowerCase();
    if (
      nextLine.startsWith("الفصل") ||
      nextLine.match(/^\d+["']?\s*$/) // like: 10"
    ) {
      startIndex++;
    }
  }
  // Skip a third header line if it's just a number like "10"
  if (startIndex < lines.length) {
    const nextLine = lines[startIndex].trim();
    if (nextLine.match(/^\d+["']*$/)) {
      startIndex++;
    }
  }

  const dataLines = lines.slice(startIndex);
  result.totalRows = dataLines.length;

  // Batch records for upsert
  const records: { student_code: string; student_name: string; grade_value: number | null }[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    // Parse CSV — handle simple comma-separated values
    // Fields: code, name, grade
    const parts = line.split(",");
    if (parts.length < 2) {
      result.errors.push(`Row ${i + 1}: Invalid format (expected at least 2 columns)`);
      result.skipped++;
      continue;
    }

    const code = parts[0].trim();
    const name = parts[1].trim();
    const gradeStr = parts.length >= 3 ? parts[2].trim() : "";

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

    const gradeValue = gradeStr ? parseFloat(gradeStr) : null;
    if (gradeStr && isNaN(gradeValue as number)) {
      result.errors.push(`Row ${i + 1}: Invalid grade value "${gradeStr}"`);
      result.skipped++;
      continue;
    }

    records.push({
      student_code: code,
      student_name: name,
      grade_value: gradeValue,
    });
  }

  if (records.length === 0) {
    result.errors.push("No valid records to import");
    return result;
  }

  // Upsert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { error } = await adminClient
      .from("grade_records")
      .upsert(batch, { onConflict: "student_code" });

    if (error) {
      result.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      result.skipped += batch.length;
    } else {
      result.imported += batch.length;
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
    .from("grade_records")
    .select("*, user_grade_links(user_id)")
    .order("student_name", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
