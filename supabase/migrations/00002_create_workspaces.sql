-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Workspace',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id)  -- one workspace per user
);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_workspaces_owner ON public.workspaces(owner_id);

COMMENT ON TABLE public.workspaces IS 'One workspace per user for file management';
