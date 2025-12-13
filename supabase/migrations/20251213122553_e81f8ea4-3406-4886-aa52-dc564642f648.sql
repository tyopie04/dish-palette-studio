-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view generated images (public bucket)
CREATE POLICY "Public can view generated images"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-images');

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload generated images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete generated images"
ON storage.objects FOR DELETE
USING (bucket_id = 'generated-images');