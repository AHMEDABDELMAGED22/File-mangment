/** Maximum file upload size in bytes (50 MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Maximum file name length */
export const MAX_FILENAME_LENGTH = 255;

/** Maximum folder name length */
export const MAX_FOLDER_NAME_LENGTH = 100;

/** Supabase Storage bucket name */
export const STORAGE_BUCKET = "files";

/** Allowed file MIME types (empty = allow all) */
export const ALLOWED_FILE_TYPES: string[] = [];

/** Blocked file extensions for security */
export const BLOCKED_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".msi", ".scr",
  ".ps1", ".vbs", ".js", ".wsf", ".wsh",
];

/** Default items per page */
export const DEFAULT_PAGE_SIZE = 50;

/** Activity log action types */
export const ACTIONS = {
  FILE_UPLOAD: "file.upload",
  FILE_DOWNLOAD: "file.download",
  FILE_DELETE: "file.delete",
  FILE_RENAME: "file.rename",
  FILE_MOVE: "file.move",
  FOLDER_CREATE: "folder.create",
  FOLDER_DELETE: "folder.delete",
  FOLDER_RENAME: "folder.rename",
  FOLDER_MOVE: "folder.move",
} as const;

/** Target types for activity logs */
export const TARGET_TYPES = {
  FILE: "file",
  FOLDER: "folder",
  WORKSPACE: "workspace",
} as const;

/** Routes */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  WORKSPACE: (id: string) => `/workspace/${id}`,
  FOLDER: (workspaceId: string, folderId: string) =>
    `/workspace/${workspaceId}/folder/${folderId}`,
  ADMIN: "/admin",
  SETTINGS: "/settings",
} as const;
