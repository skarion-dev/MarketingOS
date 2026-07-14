-- Supabase Storage bucket for marketing assets
-- Run via Supabase dashboard or SQL editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('marketing-assets', 'marketing-assets', true);

-- Storage RLS policy
CREATE POLICY "Users can view own assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'marketing-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload own assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'marketing-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'marketing-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
