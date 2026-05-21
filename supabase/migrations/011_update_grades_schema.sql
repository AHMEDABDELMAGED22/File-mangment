-- =============================================
-- Migration: Update Grades Schema to TEXT
-- Alters subject_grade_records to support 4 TEXT grades
-- =============================================

-- 1. Alter grade parts 1 and 2 to TEXT
ALTER TABLE public.subject_grade_records
  ALTER COLUMN grade_part_1 TYPE TEXT USING grade_part_1::TEXT,
  ALTER COLUMN grade_part_2 TYPE TEXT USING grade_part_2::TEXT;

-- 2. Add grade parts 3 and 4
ALTER TABLE public.subject_grade_records
  ADD COLUMN IF NOT EXISTS grade_part_3 TEXT,
  ADD COLUMN IF NOT EXISTS grade_part_4 TEXT;

