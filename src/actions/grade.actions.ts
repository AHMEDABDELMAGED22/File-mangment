"use server";

import { requireAdmin, requireAuthWithProfile } from "@/services/auth.service";
import { getUserGradeData, importGradesCsv, getAllGradeRecords, claimStudentCode, getAllSubjects, deleteSubject } from "@/services/grade.service";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Get the current user's grade data.
 */
export async function getMyGradeAction() {
  const { user } = await requireAuthWithProfile();
  const gradeData = await getUserGradeData(user.id);
  return { gradeData };
}

/**
 * Admin action to import CSV grades.
 */
export async function importGradesCsvAction(csvContent: string, subjectName: string) {
  await requireAdmin();

  if (!csvContent || csvContent.trim().length === 0) {
    return { error: "CSV content is empty" };
  }

  if (!subjectName || subjectName.trim().length === 0) {
    return { error: "Subject name is required" };
  }

  try {
    const result = await importGradesCsv(csvContent, subjectName);
    revalidatePath("/admin");
    return { result };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to import CSV" };
  }
}

/**
 * Admin action to get all grade records with claim status.
 */
export async function getAllGradeRecordsAction() {
  await requireAdmin();
  try {
    const records = await getAllGradeRecords();
    return { records };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to fetch records" };
  }
}

/**
 * Admin action to get all subjects.
 */
export async function getAllSubjectsAction() {
  await requireAdmin();
  try {
    const subjects = await getAllSubjects();
    return { subjects };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to fetch subjects" };
  }
}

/**
 * Admin action to delete a subject.
 */
export async function deleteSubjectAction(subjectId: string) {
  await requireAdmin();
  try {
    await deleteSubject(subjectId);
    revalidatePath("/admin");
    revalidatePath("/grades");
    return { success: true };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to delete subject" };
  }
}

function normalizeStudentCodeInput(code: string): string {
  return code
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .replace(/\s+/g, "")
    .replace(/[.]+$/g, "");
}

function digitsOnly(code: string): string {
  return code.replace(/\D/g, "");
}

/**
 * User action to link student code from settings after signup.
 */
export async function linkMyStudentCodeAction(formData: FormData) {
  const { user } = await requireAuthWithProfile();
  const rawCode = (formData.get("student_code") as string) || "";
  const normalizedStudentCode = normalizeStudentCodeInput(rawCode);

  if (!normalizedStudentCode) {
    return { error: "Please enter a valid code" };
  }

  const adminClient = createAdminClient();
  const candidateCodes = Array.from(
    new Set(
      [
        rawCode.trim(),
        normalizedStudentCode,
        `${normalizedStudentCode}.0`,
        `${normalizedStudentCode}.`,
        `"${normalizedStudentCode}"`,
        `'${normalizedStudentCode}'`,
      ].filter(Boolean)
    )
  );

  const { data: initialGradeRecord, error: gradeRecordError } = await adminClient
    .from("students")
    .select("student_code")
    .in("student_code", candidateCodes)
    .single();
  let gradeRecord = initialGradeRecord;

  if (gradeRecordError && gradeRecordError.code !== "PGRST116") {
    return { error: "Grade codes are not configured yet. Please contact admin." };
  }

  if (!gradeRecord) {
    const codeDigits = digitsOnly(normalizedStudentCode);
    if (codeDigits) {
      const { data: possibleMatches, error: possibleMatchesError } = await adminClient
        .from("students")
        .select("student_code")
        .ilike("student_code", `%${codeDigits}%`)
        .limit(20);

      if (possibleMatchesError) {
        return { error: "Grade codes are not configured yet. Please contact admin." };
      }

      gradeRecord =
        possibleMatches?.find((record) => {
          const normalizedRecordCode = normalizeStudentCodeInput(record.student_code);
          return (
            normalizedRecordCode === normalizedStudentCode ||
            digitsOnly(normalizedRecordCode) === codeDigits
          );
        }) ?? null;
    }
  }

  if (!gradeRecord) {
    return { error: "Invalid code" };
  }

  const claimResult = await claimStudentCode(user.id, gradeRecord.student_code);
  if (!claimResult.success) {
    return { error: claimResult.error || "Failed to link your code" };
  }

  revalidatePath("/settings");
  revalidatePath("/grades");
  return { success: "Code linked successfully. You can now view your grade." };
}
