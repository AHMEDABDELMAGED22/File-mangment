-- =============================================
-- AntiDrive — Complete Database Setup
-- Run this entire script in the Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_profiles_role ON public.profiles(role);
COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users';

-- =============================================
-- 2. WORKSPACES TABLE
-- =============================================
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Workspace',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_id)
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_workspaces_owner ON public.workspaces(owner_id);
COMMENT ON TABLE public.workspaces IS 'One workspace per user for file management';

-- =============================================
-- 3. FOLDERS TABLE
-- =============================================
CREATE TABLE public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_folders_workspace ON public.folders(workspace_id);
CREATE INDEX idx_folders_parent ON public.folders(parent_folder_id);
CREATE INDEX idx_folders_name ON public.folders(workspace_id, name);
COMMENT ON TABLE public.folders IS 'Folders within workspaces, supports nesting via parent_folder_id';

-- =============================================
-- 4. FILES TABLE
-- =============================================
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

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_files_workspace ON public.files(workspace_id);
CREATE INDEX idx_files_folder ON public.files(folder_id);
CREATE INDEX idx_files_owner ON public.files(owner_id);
CREATE INDEX idx_files_name ON public.files(workspace_id, name);
CREATE INDEX idx_files_created ON public.files(created_at DESC);
COMMENT ON TABLE public.files IS 'File metadata, actual files stored in Supabase Storage';

-- =============================================
-- 5. ACTIVITY LOGS TABLE
-- =============================================
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

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_activity_workspace ON public.activity_logs(workspace_id);
CREATE INDEX idx_activity_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_created ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_action ON public.activity_logs(action);
COMMENT ON TABLE public.activity_logs IS 'Audit log for all file and folder operations';

-- =============================================
-- 6. RLS HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_workspace_owner(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = ws_id AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- 7. RLS POLICIES — PROFILES
-- =============================================

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Service can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- =============================================
-- 8. RLS POLICIES — WORKSPACES
-- =============================================

CREATE POLICY "Users can read own workspace"
  ON public.workspaces FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own workspace"
  ON public.workspaces FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can insert own workspace"
  ON public.workspaces FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- =============================================
-- 9. RLS POLICIES — FOLDERS
-- =============================================

CREATE POLICY "Users can read own folders"
  ON public.folders FOR SELECT
  TO authenticated
  USING (public.is_workspace_owner(workspace_id) OR public.is_admin());

CREATE POLICY "Users can create folders in own workspace"
  ON public.folders FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can update own folders"
  ON public.folders FOR UPDATE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id))
  WITH CHECK (public.is_workspace_owner(workspace_id));

CREATE POLICY "Users can delete own folders"
  ON public.folders FOR DELETE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

-- =============================================
-- 10. RLS POLICIES — FILES
-- =============================================

CREATE POLICY "Users can read own files"
  ON public.files FOR SELECT
  TO authenticated
  USING (public.is_workspace_owner(workspace_id) OR public.is_admin());

CREATE POLICY "Users can insert files in own workspace"
  ON public.files FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_workspace_owner(workspace_id)
    AND owner_id = auth.uid()
  );

CREATE POLICY "Users can update own files"
  ON public.files FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete own files"
  ON public.files FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- =============================================
-- 11. RLS POLICIES — ACTIVITY LOGS
-- =============================================

CREATE POLICY "Users can read own activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (public.is_workspace_owner(workspace_id) OR public.is_admin());

CREATE POLICY "Users can insert own activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_workspace_owner(workspace_id)
    AND user_id = auth.uid()
  );

-- =============================================
-- 12. STORAGE BUCKET & POLICIES
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'files'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================
-- 13. FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_folders
  BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_files
  BEFORE UPDATE ON public.files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-create profile and workspace on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );

  INSERT INTO public.workspaces (owner_id, name)
  VALUES (NEW.id, 'My Workspace');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enforce folder parent belongs to same workspace
CREATE OR REPLACE FUNCTION public.enforce_folder_same_workspace()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_folder_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.folders
      WHERE id = NEW.parent_folder_id
      AND workspace_id = NEW.workspace_id
    ) THEN
      RAISE EXCEPTION 'Parent folder must belong to the same workspace';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_folder_parent_workspace
  BEFORE INSERT OR UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.enforce_folder_same_workspace();

-- Enforce file folder belongs to same workspace
CREATE OR REPLACE FUNCTION public.enforce_file_same_workspace()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.folder_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.folders
      WHERE id = NEW.folder_id
      AND workspace_id = NEW.workspace_id
    ) THEN
      RAISE EXCEPTION 'File folder must belong to the same workspace';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_file_folder_workspace
  BEFORE INSERT OR UPDATE ON public.files
  FOR EACH ROW EXECUTE FUNCTION public.enforce_file_same_workspace();

-- Prevent role escalation via direct update
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role != OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  IF NEW.is_active != OLD.is_active THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can change active status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_profile_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- =============================================
-- DONE! All tables, policies, and triggers created.
-- =============================================
-- Next steps:
-- 1. Sign up a user via the app
-- 2. To make them admin, run:
--    UPDATE public.profiles SET role = 'admin' WHERE id = '<user-uuid>';
-- =============================================
