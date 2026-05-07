-- =============================================
-- Grade Records & User Grade Links
-- Migration for the "Your Grades" feature
-- =============================================

-- 1. GRADE RECORDS TABLE
-- Stores imported CSV grade data (student_code, student_name, grade_value)
CREATE TABLE IF NOT EXISTS public.grade_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code TEXT NOT NULL UNIQUE,
  student_name TEXT NOT NULL,
  grade_value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_grade_records_code ON public.grade_records(student_code);
COMMENT ON TABLE public.grade_records IS 'Imported CSV grade records keyed by student code';

-- 2. USER GRADE LINKS TABLE
-- Maps one auth user to one grade record (1:1 both ways)
CREATE TABLE IF NOT EXISTS public.user_grade_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  student_code TEXT NOT NULL UNIQUE REFERENCES public.grade_records(student_code) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_grade_links ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_user_grade_links_user ON public.user_grade_links(user_id);
CREATE INDEX idx_user_grade_links_code ON public.user_grade_links(student_code);
COMMENT ON TABLE public.user_grade_links IS 'One-to-one mapping between users and grade records';

-- 3. UPDATED_AT TRIGGER for grade_records
CREATE TRIGGER set_updated_at_grade_records
  BEFORE UPDATE ON public.grade_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. RLS POLICIES — GRADE_RECORDS
-- Users can only read grade records that are linked to them
CREATE POLICY "Users can read own linked grade record"
  ON public.grade_records FOR SELECT
  TO authenticated
  USING (
    student_code IN (
      SELECT ugl.student_code FROM public.user_grade_links ugl
      WHERE ugl.user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Only admins/service role can insert grade records (via CSV import)
CREATE POLICY "Only admins can insert grade records"
  ON public.grade_records FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Only admins can update grade records
CREATE POLICY "Only admins can update grade records"
  ON public.grade_records FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Only admins can delete grade records
CREATE POLICY "Only admins can delete grade records"
  ON public.grade_records FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 5. RLS POLICIES — USER_GRADE_LINKS
-- Users can only read their own link
CREATE POLICY "Users can read own grade link"
  ON public.user_grade_links FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- Links are created server-side during signup (service role bypasses RLS)
-- But we also allow authenticated insert for the signup flow
CREATE POLICY "Users can insert own grade link"
  ON public.user_grade_links FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users cannot update or delete their grade link
-- (only admins via service role)

-- 6. ATOMIC CLAIM FUNCTION
-- Prevents race conditions: two users cannot claim the same code simultaneously
CREATE OR REPLACE FUNCTION public.claim_student_code(
  p_user_id UUID,
  p_student_code TEXT
)
RETURNS JSON AS $$
DECLARE
  v_exists BOOLEAN;
  v_claimed BOOLEAN;
  v_result JSON;
BEGIN
  -- Check if code exists in grade_records
  SELECT EXISTS(
    SELECT 1 FROM public.grade_records WHERE student_code = p_student_code
  ) INTO v_exists;

  IF NOT v_exists THEN
    RETURN json_build_object('success', false, 'error', 'Invalid code');
  END IF;

  -- Check if code is already claimed
  SELECT EXISTS(
    SELECT 1 FROM public.user_grade_links WHERE student_code = p_student_code
  ) INTO v_claimed;

  IF v_claimed THEN
    RETURN json_build_object('success', false, 'error', 'This code has already been claimed');
  END IF;

  -- Check if user already has a code
  SELECT EXISTS(
    SELECT 1 FROM public.user_grade_links WHERE user_id = p_user_id
  ) INTO v_claimed;

  IF v_claimed THEN
    RETURN json_build_object('success', false, 'error', 'Your account already has a code linked');
  END IF;

  -- Attempt the insert (UNIQUE constraints prevent race conditions)
  BEGIN
    INSERT INTO public.user_grade_links (user_id, student_code)
    VALUES (p_user_id, p_student_code);

    RETURN json_build_object('success', true);
  EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'This code has already been claimed');
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DONE! Grade tables, policies, and claim function created.
-- =============================================
