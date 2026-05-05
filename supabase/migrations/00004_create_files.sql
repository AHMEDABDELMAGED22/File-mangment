-- Create files table
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_files_workspace ON public.files(workspace_id);
CREATE INDEX idx_files_folder ON public.files(folder_id);
CREATE INDEX idx_files_owner ON public.files(owner_id);
CREATE INDEX idx_files_name ON public.files(workspace_id, name);
CREATE INDEX idx_files_created ON public.files(created_at DESC);

COMMENT ON TABLE public.files IS 'File metadata, actual files stored in Supabase Storage';
