
CREATE POLICY "Public read songai-media"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'songai-media');
