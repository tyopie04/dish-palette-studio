-- Fix menu_photos RLS: require authentication to view photos
DROP POLICY IF EXISTS "Anyone can view photos" ON public.menu_photos;

CREATE POLICY "Users can view own photos" 
ON public.menu_photos 
FOR SELECT 
USING (auth.uid() = user_id);

-- Fix storage policies for menu-photos bucket
DROP POLICY IF EXISTS "Users can view own menu photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own menu photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own menu photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own menu photos" ON storage.objects;

-- Allow public viewing of menu-photos (images need to be viewable)
CREATE POLICY "Public can view menu-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-photos');

-- Require authentication to upload to menu-photos
CREATE POLICY "Authenticated users can upload to menu-photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'menu-photos' AND auth.uid() IS NOT NULL);

-- Require authentication to delete from menu-photos
CREATE POLICY "Authenticated users can delete from menu-photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'menu-photos' AND auth.uid() IS NOT NULL);