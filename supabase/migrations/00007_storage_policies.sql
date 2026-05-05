-- =============================================
-- Supabase Storage bucket and policies
-- =============================================

-- Create the files bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: users can upload files to their own folder (user_id prefix)
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: users can read their own files
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

-- Storage policy: users can update their own files
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policy: users can delete their own files
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
