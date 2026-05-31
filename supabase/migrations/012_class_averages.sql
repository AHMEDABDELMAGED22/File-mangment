-- =============================================
-- System Settings & Class Averages
-- =============================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Default setting
INSERT INTO public.system_settings (key, value) 
VALUES ('show_class_averages', 'false'::jsonb) 
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system settings" 
  ON public.system_settings FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can update system settings" 
  ON public.system_settings FOR UPDATE 
  USING (public.is_admin()) 
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can insert system settings" 
  ON public.system_settings FOR INSERT 
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can delete system settings" 
  ON public.system_settings FOR DELETE 
  USING (public.is_admin());

-- Helper: Check if string is numeric
CREATE OR REPLACE FUNCTION public.is_numeric(text) 
RETURNS boolean AS $$
BEGIN
    RETURN $1 ~ '^([0-9]+[.]?[0-9]*|[.][0-9]+)$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- RPC: Get subject averages
CREATE OR REPLACE FUNCTION public.get_subject_averages()
RETURNS TABLE (
  subject_id UUID,
  avg_part_1 NUMERIC,
  avg_part_2 NUMERIC,
  avg_part_3 NUMERIC,
  avg_part_4 NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sgr.subject_id,
    ROUND(AVG(CASE WHEN public.is_numeric(sgr.grade_part_1) THEN sgr.grade_part_1::numeric ELSE NULL END), 1),
    ROUND(AVG(CASE WHEN public.is_numeric(sgr.grade_part_2) THEN sgr.grade_part_2::numeric ELSE NULL END), 1),
    ROUND(AVG(CASE WHEN public.is_numeric(sgr.grade_part_3) THEN sgr.grade_part_3::numeric ELSE NULL END), 1),
    ROUND(AVG(CASE WHEN public.is_numeric(sgr.grade_part_4) THEN sgr.grade_part_4::numeric ELSE NULL END), 1)
  FROM public.subject_grade_records sgr
  GROUP BY sgr.subject_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
