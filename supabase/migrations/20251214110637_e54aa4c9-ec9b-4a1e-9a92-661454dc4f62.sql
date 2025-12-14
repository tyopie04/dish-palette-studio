-- Add back public read access for menu_photos while keeping write operations restricted
DROP POLICY IF EXISTS "Users can view own photos" ON public.menu_photos;

-- Allow public read access (photos should be viewable)
CREATE POLICY "Anyone can view photos" 
ON public.menu_photos 
FOR SELECT 
USING (true);

-- Keep insert/update/delete restricted to owners (already in place)