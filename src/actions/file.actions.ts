"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/services/auth.service";
import * as fileService from "@/services/file.service";
import { logActivity } from "@/services/activity.service";
import { renameFileSchema, moveFileSchema, deleteFileSchema } from "@/lib/validators/file";
import { ACTIONS, TARGET_TYPES, MAX_FILE_SIZE, BLOCKED_EXTENSIONS } from "@/lib/constants";

export async function uploadFileAction(formData: FormData) {
  const user = await requireAuth();
  const workspaceId = formData.get("workspace_id") as string;
  const folderId = (formData.get("folder_id") as string) || null;
  const file = formData.get("file") as File;

  if (!file || !workspaceId) return { error: "Missing required fields" };
  if (file.size > MAX_FILE_SIZE) return { error: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` };

  const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
  if (BLOCKED_EXTENSIONS.includes(ext)) return { error: `File type ${ext} is not allowed` };

  try {
    const record = await fileService.uploadFile(user.id, workspaceId, folderId, file);
    await logActivity(workspaceId, user.id, ACTIONS.FILE_UPLOAD, TARGET_TYPES.FILE, record.id, { name: record.name, size: record.size_bytes });
    revalidatePath("/workspace");
    return { success: true, file: record };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Upload failed" };
  }
}

export async function deleteFileAction(formData: FormData) {
  const user = await requireAuth();
  const raw = { file_id: formData.get("file_id") as string };
  const parsed = deleteFileSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const sb = await createClient();
    const { data: file } = await sb.from("files").select("workspace_id, name").eq("id", parsed.data.file_id).single();
    if (!file) return { error: "File not found" };

    await fileService.deleteFile(parsed.data.file_id);
    await logActivity(file.workspace_id, user.id, ACTIONS.FILE_DELETE, TARGET_TYPES.FILE, parsed.data.file_id, { name: file.name });
    revalidatePath("/workspace");
    return { success: true };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Delete failed" };
  }
}

export async function renameFileAction(formData: FormData) {
  const user = await requireAuth();
  const raw = { file_id: formData.get("file_id") as string, name: formData.get("name") as string };
  const parsed = renameFileSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const record = await fileService.renameFile(parsed.data.file_id, parsed.data.name);
    await logActivity(record.workspace_id, user.id, ACTIONS.FILE_RENAME, TARGET_TYPES.FILE, record.id, { name: record.name });
    revalidatePath("/workspace");
    return { success: true, file: record };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Rename failed" };
  }
}

export async function moveFileAction(formData: FormData) {
  const user = await requireAuth();
  const raw = { file_id: formData.get("file_id") as string, target_folder_id: (formData.get("target_folder_id") as string) || null };
  const parsed = moveFileSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const record = await fileService.moveFile(parsed.data.file_id, parsed.data.target_folder_id);
    await logActivity(record.workspace_id, user.id, ACTIONS.FILE_MOVE, TARGET_TYPES.FILE, record.id, { name: record.name });
    revalidatePath("/workspace");
    return { success: true, file: record };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Move failed" };
  }
}

export async function downloadFileAction(fileId: string, isDownload = false) {
  await requireAuth();
  try {
    const url = await fileService.getDownloadUrl(fileId, isDownload);
    return { success: true, url };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Download failed" };
  }
}
