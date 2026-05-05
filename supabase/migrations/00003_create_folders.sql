-- Create folders table
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_folders_workspace ON public.folders(workspace_id);
CREATE INDEX idx_folders_parent ON public.folders(parent_folder_id);
CREATE INDEX idx_folders_name ON public.folders(workspace_id, name);

COMMENT ON TABLE public.folders IS 'Folders within workspaces, supports nesting via parent_folder_id';
