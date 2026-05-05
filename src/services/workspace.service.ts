import { createClient } from "@/lib/supabase/server";
import type { Folder, FileRecord, WorkspaceContents, BreadcrumbItem, Workspace } from "@/lib/types";
import { ROUTES } from "@/lib/constants";

/**
 * Get the current user's workspace
 */
export async function getUserWorkspace(userId: string): Promise<Workspace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", userId)
    .single();

  if (error || !data) return null;
  return data as Workspace;
}

/**
 * Get workspace by ID (RLS will enforce ownership)
 */
export async function getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (error || !data) return null;
  return data as Workspace;
}

/**
 * Get workspace contents (folders + files) at a given level
 */
export async function getWorkspaceContents(
  workspaceId: string,
  folderId?: string | null,
  sortBy: string = "name",
  sortOrder: "asc" | "desc" = "asc",
  search?: string
): Promise<WorkspaceContents> {
  const supabase = await createClient();

  // Fetch folders
  let foldersQuery = supabase
    .from("folders")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (folderId) {
    foldersQuery = foldersQuery.eq("parent_folder_id", folderId);
  } else {
    foldersQuery = foldersQuery.is("parent_folder_id", null);
  }

  if (search) {
    foldersQuery = foldersQuery.ilike("name", `%${search}%`);
  }

  foldersQuery = foldersQuery.order(sortBy === "size" ? "name" : sortBy, {
    ascending: sortOrder === "asc",
  });

  // Fetch files
  let filesQuery = supabase
    .from("files")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (folderId) {
    filesQuery = filesQuery.eq("folder_id", folderId);
  } else {
    filesQuery = filesQuery.is("folder_id", null);
  }

  if (search) {
    filesQuery = filesQuery.ilike("name", `%${search}%`);
  }

  if (sortBy === "size") {
    filesQuery = filesQuery.order("size_bytes", { ascending: sortOrder === "asc" });
  } else {
    filesQuery = filesQuery.order(sortBy, { ascending: sortOrder === "asc" });
  }

  const [foldersResult, filesResult] = await Promise.all([foldersQuery, filesQuery]);

  return {
    folders: (foldersResult.data as Folder[]) || [],
    files: (filesResult.data as FileRecord[]) || [],
  };
}

/**
 * Create a new folder
 */
export async function createFolder(
  workspaceId: string,
  name: string,
  parentFolderId?: string | null
): Promise<Folder> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("folders")
    .insert({
      workspace_id: workspaceId,
      name: name.trim(),
      parent_folder_id: parentFolderId || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Folder;
}

/**
 * Rename a folder
 */
export async function renameFolder(folderId: string, newName: string): Promise<Folder> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("folders")
    .update({ name: newName.trim() })
    .eq("id", folderId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Folder;
}

/**
 * Move a folder to a different parent
 */
export async function moveFolder(
  folderId: string,
  targetParentFolderId: string | null
): Promise<Folder> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("folders")
    .update({ parent_folder_id: targetParentFolderId })
    .eq("id", folderId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Folder;
}

/**
 * Delete a folder and all its contents recursively
 * The database handles cascading deletes for child folders.
 * We need to clean up storage files manually.
 */
export async function deleteFolder(folderId: string): Promise<void> {
  const supabase = await createClient();

  // First, collect all file storage paths in this folder tree
  const storagePaths = await collectFolderFilePaths(folderId);

  // Delete from storage
  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("files")
      .remove(storagePaths);
    if (storageError) {
      console.error("Storage cleanup error:", storageError);
    }
  }

  // Delete the folder (cascades to child folders and sets file folder_id to null)
  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("id", folderId);

  if (error) throw new Error(error.message);
}

/**
 * Recursively collect all file storage paths in a folder tree
 */
async function collectFolderFilePaths(folderId: string): Promise<string[]> {
  const supabase = await createClient();
  const paths: string[] = [];

  // Get files in this folder
  const { data: files } = await supabase
    .from("files")
    .select("storage_path")
    .eq("folder_id", folderId);

  if (files) {
    paths.push(...files.map((f) => f.storage_path));
  }

  // Get child folders
  const { data: childFolders } = await supabase
    .from("folders")
    .select("id")
    .eq("parent_folder_id", folderId);

  if (childFolders) {
    for (const child of childFolders) {
      const childPaths = await collectFolderFilePaths(child.id);
      paths.push(...childPaths);
    }
  }

  return paths;
}

/**
 * Get breadcrumb trail for a folder
 */
export async function getFolderBreadcrumbs(
  workspaceId: string,
  folderId: string
): Promise<BreadcrumbItem[]> {
  const supabase = await createClient();
  const breadcrumbs: BreadcrumbItem[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const result = await supabase
      .from("folders")
      .select("id, name, parent_folder_id")
      .eq("id", currentId)
      .single();

    const row = result.data as { id: string; name: string; parent_folder_id: string | null } | null;
    if (!row) break;

    breadcrumbs.unshift({
      id: row.id,
      name: row.name,
      href: ROUTES.FOLDER(workspaceId, row.id),
    });

    currentId = row.parent_folder_id;
  }

  return breadcrumbs;
}

/**
 * Get all folders in a workspace (for move dialog)
 */
export async function getAllFolders(workspaceId: string): Promise<Folder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("name");

  if (error) throw new Error(error.message);
  return (data as Folder[]) || [];
}

/**
 * Get all workspaces (admin only)
 */
export async function getAllWorkspaces(): Promise<(Workspace & { profiles: { full_name: string; role: string } })[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("*, profiles!workspaces_owner_id_fkey(full_name, role)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}
