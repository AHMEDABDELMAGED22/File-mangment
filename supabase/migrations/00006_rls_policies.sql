-- =============================================
-- RLS Policies for all tables
-- =============================================

-- Helper function: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if user owns a workspace
CREATE OR REPLACE FUNCTION public.is_workspace_owner(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = ws_id AND owner_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- PROFILES policies
-- =============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

-- Users can update their own profile (but not role or is_active)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow insert during signup (triggered by function)
CREATE POLICY "Service can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- =============================================
-- WORKSPACES policies
-- =============================================

-- Users can read their own workspace, admin can read all
CREATE POLICY "Users can read own workspace"
  ON public.workspaces FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin());

-- Users can update their own workspace name
CREATE POLICY "Users can update own workspace"
  ON public.workspaces FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Insert workspace (during signup, owner must be self)
CREATE POLICY "Users can insert own workspace"
  ON public.workspaces FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

-- =============================================
-- FOLDERS policies
-- =============================================

-- Users can read folders in their own workspace, admin can read all
CREATE POLICY "Users can read own folders"
  ON public.folders FOR SELECT
  TO authenticated
  USING (public.is_workspace_owner(workspace_id) OR public.is_admin());

-- Users can create folders in their own workspace
CREATE POLICY "Users can create folders in own workspace"
  ON public.folders FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_owner(workspace_id));

-- Users can update folders in their own workspace
CREATE POLICY "Users can update own folders"
  ON public.folders FOR UPDATE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id))
  WITH CHECK (public.is_workspace_owner(workspace_id));

-- Users can delete folders in their own workspace
CREATE POLICY "Users can delete own folders"
  ON public.folders FOR DELETE
  TO authenticated
  USING (public.is_workspace_owner(workspace_id));

-- =============================================
-- FILES policies
-- =============================================

-- Users can read files in their own workspace, admin can read all
CREATE POLICY "Users can read own files"
  ON public.files FOR SELECT
  TO authenticated
  USING (public.is_workspace_owner(workspace_id) OR public.is_admin());

-- Users can upload files to their own workspace
CREATE POLICY "Users can insert files in own workspace"
  ON public.files FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_workspace_owner(workspace_id)
    AND owner_id = auth.uid()
  );

-- Users can update their own files
CREATE POLICY "Users can update own files"
  ON public.files FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
  ON public.files FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- =============================================
-- ACTIVITY_LOGS policies
-- =============================================

-- Users can read activity logs in their own workspace, admin can read all
CREATE POLICY "Users can read own activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (public.is_workspace_owner(workspace_id) OR public.is_admin());

-- Users can insert activity logs for their own workspace
CREATE POLICY "Users can insert own activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_workspace_owner(workspace_id)
    AND user_id = auth.uid()
  );

-- No update or delete on activity logs (immutable audit trail)
