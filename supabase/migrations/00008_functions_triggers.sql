-- =============================================
-- Functions and Triggers
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_folders
  BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_files
  BEFORE UPDATE ON public.files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- Auto-create profile and workspace on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );

  -- Create workspace
  INSERT INTO public.workspaces (owner_id, name)
  VALUES (NEW.id, 'My Workspace');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Enforce folder parent belongs to same workspace
-- =============================================
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

-- =============================================
-- Enforce file folder belongs to same workspace
-- =============================================
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

-- =============================================
-- Prevent role escalation via direct update
-- =============================================
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow admins to change roles
  IF NEW.role != OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  -- Prevent users from changing their own is_active status
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
