-- =============================================
-- Migration: Multiple Subjects Support
-- Restructures grades to support Networks and JavaScript
-- =============================================

-- 1. Create students table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code TEXT NOT NULL UNIQUE,
  canonical_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create grade_subjects table
CREATE TABLE IF NOT EXISTS public.grade_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

INSERT INTO public.grade_subjects (slug, name) VALUES 
  ('networks', 'Networks'),
  ('javascript', 'JavaScript')
ON CONFLICT (slug) DO NOTHING;

-- 3. Create subject_grade_records table
CREATE TABLE IF NOT EXISTS public.subject_grade_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.grade_subjects(id) ON DELETE CASCADE,
  student_code TEXT NOT NULL REFERENCES public.students(student_code) ON DELETE CASCADE,
  grade_part_1 NUMERIC, -- Networks Total OR JavaScript Assignments
  grade_part_2 NUMERIC, -- JavaScript Midterm
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(subject_id, student_code)
);

-- 4. Migrate data from grade_records to new tables (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grade_records') THEN
    -- Insert students
    INSERT INTO public.students (student_code, canonical_name, created_at)
    SELECT student_code, student_name, created_at
    FROM public.grade_records
    ON CONFLICT (student_code) DO NOTHING;

    -- Insert into subject_grade_records (all existing are Networks)
    INSERT INTO public.subject_grade_records (subject_id, student_code, grade_part_1, created_at, updated_at)
    SELECT 
      (SELECT id FROM public.grade_subjects WHERE slug = 'networks'),
      student_code,
      grade_value,
      created_at,
      updated_at
    FROM public.grade_records
    ON CONFLICT (subject_id, student_code) DO NOTHING;
  END IF;
END $$;

-- 5. Update user_grade_links to point to students.student_code
-- First, ensure any student code in user_grade_links exists in students
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_grade_links') THEN
    ALTER TABLE public.user_grade_links 
      DROP CONSTRAINT IF EXISTS user_grade_links_student_code_fkey;
    
    ALTER TABLE public.user_grade_links
      ADD CONSTRAINT user_grade_links_student_code_fkey 
      FOREIGN KEY (student_code) REFERENCES public.students(student_code) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. Trigger for updated_at
CREATE TRIGGER set_updated_at_subject_grade_records
  BEFORE UPDATE ON public.subject_grade_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 7. RLS Policies
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_grade_records ENABLE ROW LEVEL SECURITY;

-- students RLS
CREATE POLICY "Users can read own linked student record"
  ON public.students FOR SELECT TO authenticated
  USING (
    student_code IN (SELECT ugl.student_code FROM public.user_grade_links ugl WHERE ugl.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Only admins can modify students"
  ON public.students FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- grade_subjects RLS
CREATE POLICY "Anyone can read subjects"
  ON public.grade_subjects FOR SELECT TO authenticated USING (true);

-- subject_grade_records RLS
CREATE POLICY "Users can read own linked grades"
  ON public.subject_grade_records FOR SELECT TO authenticated
  USING (
    student_code IN (SELECT ugl.student_code FROM public.user_grade_links ugl WHERE ugl.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Only admins can modify subject grades"
  ON public.subject_grade_records FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 8. Update claim_student_code function
CREATE OR REPLACE FUNCTION public.claim_student_code(
  p_user_id UUID,
  p_student_code TEXT
)
RETURNS JSON AS $$
DECLARE
  v_exists BOOLEAN;
  v_claimed BOOLEAN;
BEGIN
  -- Check if code exists in students (instead of grade_records)
  SELECT EXISTS(SELECT 1 FROM public.students WHERE student_code = p_student_code) INTO v_exists;
  IF NOT v_exists THEN RETURN json_build_object('success', false, 'error', 'Invalid code'); END IF;

  -- Check if code is already claimed
  SELECT EXISTS(SELECT 1 FROM public.user_grade_links WHERE student_code = p_student_code) INTO v_claimed;
  IF v_claimed THEN RETURN json_build_object('success', false, 'error', 'This code has already been claimed'); END IF;

  -- Check if user already has a code
  SELECT EXISTS(SELECT 1 FROM public.user_grade_links WHERE user_id = p_user_id) INTO v_claimed;
  IF v_claimed THEN RETURN json_build_object('success', false, 'error', 'Your account already has a code linked'); END IF;

  BEGIN
    INSERT INTO public.user_grade_links (user_id, student_code) VALUES (p_user_id, p_student_code);
    RETURN json_build_object('success', true);
  EXCEPTION WHEN unique_violation THEN
    RETURN json_build_object('success', false, 'error', 'This code has already been claimed');
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Drop old table
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'grade_records') THEN
    DROP TABLE public.grade_records CASCADE;
  END IF;
END $$;
