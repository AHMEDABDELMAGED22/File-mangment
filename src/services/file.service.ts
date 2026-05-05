import { createClient } from "@/lib/supabase/server";
import type { FileRecord, StorageUsage } from "@/lib/types";
import { STORAGE_BUCKET, MAX_FILE_SIZE, BLOCKED_EXTENSIONS } from "@/lib/constants";

/**
 * Sanitize a filename to prevent path traversal and invalid characters.
 * If storageSafe is true, it removes all non-ASCII characters.
 */
export function sanitizeFilename(filename: string, storageSafe = false): string {
  // Remove path separators and traversal patterns
  let sanitized = filename
    .replace(/\.\./g, "")
    .replace(/[/\\]/g, "")
    .replace(/\x00/g, "")
    .replace(/[<>:"|?*\x00-\x1f]/g, "_")
    .trim();

  if (storageSafe) {
    // For storage paths, remove everything except English letters, numbers, dots, and underscores
    sanitized = sanitized.replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, "_");
    
    // Ensure we don't end up with an empty string if the whole filename was non-ASCII
    const base = sanitized.split('.')[0];
    const ext = sanitized.split('.').pop() || "";
    if (!base || base === ext) {
      sanitized = "file_" + Date.now() + (ext ? "." + ext : "");
    }
  }

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split(".").pop() || "";
    sanitized = sanitized.substring(0, 250 - ext.length) + "." + ext;
  }

  // Ensure non-empty
  if (!sanitized || sanitized === ".") {
    sanitized = "unnamed_file";
  }

  return sanitized;
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File type ${ext} is not allowed`,
    };
  }

  return { valid: true };
}

/**
 * Upload a file to Supabase Storage and create a database record
 */
export async function uploadFile(
  userId: string,
  workspaceId: string,
  folderId: string | null,
  file: File
): Promise<FileRecord> {
  const supabase = await createClient();
  const displayName = sanitizeFilename(file.name, false); // Keep non-ASCII for UI
  const storageSafeName = sanitizeFilename(file.name, true); // Safe for storage
  const fileId = crypto.randomUUID();
  const storagePath = `${userId}/${fileId}_${storageSafeName}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  // Create database record
  const { data, error: dbError } = await supabase
    .from("files")
    .insert({
      id: fileId,
      workspace_id: workspaceId,
      folder_id: folderId,
      owner_id: userId,
      name: displayName,
      storage_path: storagePath,
      mime_type: file.type || "application/octet-stream",
      size_bytes: file.size,
    })
    .select()
    .single();

  if (dbError) {
    // Rollback: remove from storage if DB insert fails
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw new Error(`Failed to save file metadata: ${dbError.message}`);
  }

  return data as FileRecord;
}

/**
 * Register file metadata in the database (used for client-side uploads)
 */
export async function registerFileMetadata(
  userId: string,
  workspaceId: string,
  folderId: string | null,
  fileData: {
    id: string;
    name: string;
    storage_path: string;
    mime_type: string;
    size_bytes: number;
  }
): Promise<FileRecord> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("files")
    .insert({
      id: fileData.id,
      workspace_id: workspaceId,
      folder_id: folderId,
      owner_id: userId,
      name: fileData.name,
      storage_path: fileData.storage_path,
      mime_type: fileData.mime_type,
      size_bytes: fileData.size_bytes,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save file metadata: ${error.message}`);
  return data as FileRecord;
}

/**
 * Generate a signed download URL for a file
 */
export async function getDownloadUrl(fileId: string, isDownload = false): Promise<string> {
  const supabase = await createClient();

  // Get file record
  const { data: file, error } = await supabase
    .from("files")
    .select("storage_path, name")
    .eq("id", fileId)
    .single();

  if (error || !file) throw new Error("File not found");

  // Generate signed URL (valid for 1 hour)
  const { data: urlData, error: urlError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(file.storage_path, 3600, {
      ...(isDownload ? { download: file.name } : {}),
    });

  if (urlError || !urlData) throw new Error("Failed to generate download URL");

  return urlData.signedUrl;
}

/**
 * Delete a file from storage and database
 */
export async function deleteFile(fileId: string): Promise<void> {
  const supabase = await createClient();

  // Get file record
  const { data: file, error: fetchError } = await supabase
    .from("files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (fetchError || !file) throw new Error("File not found");

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([file.storage_path]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from("files")
    .delete()
    .eq("id", fileId);

  if (dbError) throw new Error(dbError.message);
}

/**
 * Rename a file
 */
export async function renameFile(fileId: string, newName: string): Promise<FileRecord> {
  const supabase = await createClient();
  const sanitizedName = sanitizeFilename(newName);

  const { data, error } = await supabase
    .from("files")
    .update({ name: sanitizedName })
    .eq("id", fileId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as FileRecord;
}

/**
 * Move a file to a different folder
 */
export async function moveFile(
  fileId: string,
  targetFolderId: string | null
): Promise<FileRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("files")
    .update({ folder_id: targetFolderId })
    .eq("id", fileId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as FileRecord;
}

/**
 * Get recent files for a workspace
 */
export async function getRecentFiles(
  workspaceId: string,
  limit: number = 10
): Promise<FileRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as FileRecord[]) || [];
}

/**
 * Get storage usage for a workspace
 */
export async function getStorageUsage(workspaceId: string): Promise<StorageUsage> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("files")
    .select("size_bytes")
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(error.message);

  const totalBytes = (data || []).reduce(
    (sum, file) => sum + (file.size_bytes || 0),
    0
  );

  return {
    total_bytes: totalBytes,
    file_count: (data || []).length,
  };
}

/**
 * Get storage usage per user (admin)
 */
export async function getStorageUsageByUser(): Promise<
  { user_id: string; total_bytes: number; file_count: number }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("files")
    .select("owner_id, size_bytes");

  if (error) throw new Error(error.message);

  const usageMap = new Map<string, { total_bytes: number; file_count: number }>();

  for (const file of data || []) {
    const existing = usageMap.get(file.owner_id) || {
      total_bytes: 0,
      file_count: 0,
    };
    existing.total_bytes += file.size_bytes || 0;
    existing.file_count += 1;
    usageMap.set(file.owner_id, existing);
  }

  return Array.from(usageMap.entries()).map(([user_id, usage]) => ({
    user_id,
    ...usage,
  }));
}
