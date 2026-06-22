-- Create the songai-media storage bucket (public read, service_role write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'songai-media',
  'songai-media',
  true,
  52428800,  -- 50 MB max per file
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif',
    'audio/mpeg','audio/wav','audio/ogg','audio/webm','audio/mp4',
    'audio/flac','audio/aac',
    'video/mp4','video/quicktime','video/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Service role can upload/delete; anon/authenticated can only read (via the policy in previous migration)
CREATE POLICY "Service role can manage songai-media"
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'songai-media')
WITH CHECK (bucket_id = 'songai-media');
