"use server";

import { requireAdmin, requireAuthWithProfile } from "@/services/auth.service";
import { getUserGradeData, importGradesCsv, getAllGradeRecords } from "@/services/grade.service";
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
export async function importGradesCsvAction(csvContent: string) {
  await requireAdmin();

  if (!csvContent || csvContent.trim().length === 0) {
    return { error: "CSV content is empty" };
  }

  try {
    const result = await importGradesCsv(csvContent);
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
