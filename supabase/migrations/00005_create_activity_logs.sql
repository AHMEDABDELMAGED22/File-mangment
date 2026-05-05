-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_activity_workspace ON public.activity_logs(workspace_id);
CREATE INDEX idx_activity_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_created ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_action ON public.activity_logs(action);

COMMENT ON TABLE public.activity_logs IS 'Audit log for all file and folder operations';
