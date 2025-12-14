-- Drop existing restrictive policies on menu_photos
DROP POLICY IF EXISTS "Public can view all photos" ON public.menu_photos;
DROP POLICY IF EXISTS "Users can view own photos" ON public.menu_photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON public.menu_photos;
DROP POLICY IF EXISTS "Users can insert own photos" ON public.menu_photos;
DROP POLICY IF EXISTS "Users can update own photos" ON public.menu_photos;

-- Recreate as PERMISSIVE policies (default, proper behavior)
CREATE POLICY "Users can view own photos" 
ON public.menu_photos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own photos" 
ON public.menu_photos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos" 
ON public.menu_photos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own photos" 
ON public.menu_photos 
FOR DELETE 
USING (auth.uid() = user_id);