"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/services/auth.service";
import * as workspaceService from "@/services/workspace.service";
import { logActivity } from "@/services/activity.service";
import { createFolderSchema, renameFolderSchema, moveFolderSchema, deleteFolderSchema } from "@/lib/validators/workspace";
import { ACTIONS, TARGET_TYPES } from "@/lib/constants";

export async function createFolderAction(formData: FormData) {
  const user = await requireAuth();
  const raw = { name: formData.get("name") as string, workspace_id: formData.get("workspace_id") as string, parent_folder_id: (formData.get("parent_folder_id") as string) || null };
  const parsed = createFolderSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const folder = await workspaceService.createFolder(parsed.data.workspace_id, parsed.data.name, parsed.data.parent_folder_id);
    await logActivity(parsed.data.workspace_id, user.id, ACTIONS.FOLDER_CREATE, TARGET_TYPES.FOLDER, folder.id, { name: folder.name });
    revalidatePath("/workspace", "layout");
    return { success: true, folder };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to create folder" };
  }
}

export async function renameFolderAction(formData: FormData) {
  const user = await requireAuth();
  const raw = { folder_id: formData.get("folder_id") as string, name: formData.get("name") as string };
  const parsed = renameFolderSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const folder = await workspaceService.renameFolder(parsed.data.folder_id, parsed.data.name);
    await logActivity(folder.workspace_id, user.id, ACTIONS.FOLDER_RENAME, TARGET_TYPES.FOLDER, folder.id, { name: folder.name });
    revalidatePath("/workspace", "layout");
    return { success: true, folder };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to rename folder" };
  }
}

export async function moveFolderAction(formData: FormData) {
  const user = await requireAuth();
  const raw = { folder_id: formData.get("folder_id") as string, target_parent_folder_id: (formData.get("target_parent_folder_id") as string) || null };
  const parsed = moveFolderSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const folder = await workspaceService.moveFolder(parsed.data.folder_id, parsed.data.target_parent_folder_id);
    await logActivity(folder.workspace_id, user.id, ACTIONS.FOLDER_MOVE, TARGET_TYPES.FOLDER, folder.id, { name: folder.name });
    revalidatePath("/workspace", "layout");
    return { success: true, folder };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to move folder" };
  }
}

export async function deleteFolderAction(formData: FormData) {
  const user = await requireAuth();
  const raw = { folder_id: formData.get("folder_id") as string };
  const parsed = deleteFolderSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    // Get workspace_id before deletion for logging
    const supabase = (await import("@/lib/supabase/server")).createClient;
    const sb = await supabase();
    const { data: folder } = await sb.from("folders").select("workspace_id, name").eq("id", parsed.data.folder_id).single();
    if (!folder) return { error: "Folder not found" };

    await workspaceService.deleteFolder(parsed.data.folder_id);
    await logActivity(folder.workspace_id, user.id, ACTIONS.FOLDER_DELETE, TARGET_TYPES.FOLDER, parsed.data.folder_id, { name: folder.name });
    revalidatePath("/workspace", "layout");
    return { success: true };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Failed to delete folder" };
  }
}
