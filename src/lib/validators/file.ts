import { z } from "zod";
import { MAX_FILENAME_LENGTH } from "@/lib/constants";

export const renameFileSchema = z.object({
  file_id: z.string().uuid("Invalid file ID"),
  name: z
    .string()
    .min(1, "File name is required")
    .max(MAX_FILENAME_LENGTH, `File name must be less than ${MAX_FILENAME_LENGTH} characters`)
    .regex(/^[^<>:"/\\|?*\x00-\x1f]+$/, "File name contains invalid characters"),
});

export const moveFileSchema = z.object({
  file_id: z.string().uuid("Invalid file ID"),
  target_folder_id: z.string().uuid("Invalid target folder ID").nullable(),
});

export const deleteFileSchema = z.object({
  file_id: z.string().uuid("Invalid file ID"),
});

export const uploadFileSchema = z.object({
  workspace_id: z.string().uuid("Invalid workspace ID"),
  folder_id: z.string().uuid("Invalid folder ID").nullable().optional(),
});

export type RenameFileInput = z.infer<typeof renameFileSchema>;
export type MoveFileInput = z.infer<typeof moveFileSchema>;
export type DeleteFileInput = z.infer<typeof deleteFileSchema>;
export type UploadFileInput = z.infer<typeof uploadFileSchema>;
