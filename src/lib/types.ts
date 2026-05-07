export type UserRole = "admin" | "user";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface Folder {
  id: string;
  workspace_id: string;
  parent_folder_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface FileRecord {
  id: string;
  workspace_id: string;
  folder_id: string | null;
  owner_id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  workspace_id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface WorkspaceContents {
  folders: Folder[];
  files: FileRecord[];
}

export interface BreadcrumbItem {
  id: string;
  name: string;
  href: string;
}

export interface StorageUsage {
  total_bytes: number;
  file_count: number;
}

export interface UserWithWorkspace extends Profile {
  workspace?: Workspace;
  storage_usage?: StorageUsage;
}

export interface GradeRecord {
  id: string;
  student_code: string;
  student_name: string;
  grade_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserGradeLink {
  id: string;
  user_id: string;
  student_code: string;
  created_at: string;
}

export interface UserGradeData {
  student_code: string;
  student_name: string;
  grade_value: number | null;
}
