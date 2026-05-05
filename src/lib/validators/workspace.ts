import { z } from "zod";
import { MAX_FOLDER_NAME_LENGTH } from "@/lib/constants";

export const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(MAX_FOLDER_NAME_LENGTH, `Folder name must be less than ${MAX_FOLDER_NAME_LENGTH} characters`)
    .regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, "Folder name contains invalid characters"),
  workspace_id: z.string().uuid("Invalid workspace ID"),
  parent_folder_id: z.string().uuid("Invalid folder ID").nullable().optional(),
});

export const renameFolderSchema = z.object({
  folder_id: z.string().uuid("Invalid folder ID"),
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(MAX_FOLDER_NAME_LENGTH, `Folder name must be less than ${MAX_FOLDER_NAME_LENGTH} characters`)
    .regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, "Folder name contains invalid characters"),
});

export const moveFolderSchema = z.object({
  folder_id: z.string().uuid("Invalid folder ID"),
  target_parent_folder_id: z.string().uuid("Invalid target folder ID").nullable(),
});

export const deleteFolderSchema = z.object({
  folder_id: z.string().uuid("Invalid folder ID"),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type RenameFolderInput = z.infer<typeof renameFolderSchema>;
export type MoveFolderInput = z.infer<typeof moveFolderSchema>;
export type DeleteFolderInput = z.infer<typeof deleteFolderSchema>;
