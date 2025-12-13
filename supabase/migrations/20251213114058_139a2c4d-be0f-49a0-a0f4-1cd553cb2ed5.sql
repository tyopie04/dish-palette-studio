-- Allow public read access to menu_photos (no login required)
CREATE POLICY "Public can view all photos" 
ON public.menu_photos 
FOR SELECT 
USING (true);

-- Allow public read access to generations
CREATE POLICY "Public can view all generations" 
ON public.generations 
FOR SELECT 
USING (true);

-- Allow public insert for generations (for AI generation to work)
CREATE POLICY "Public can insert generations" 
ON public.generations 
FOR INSERT 
WITH CHECK (true);