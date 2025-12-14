-- Allow anyone to delete generations (since they're being created with placeholder user_id)
DROP POLICY IF EXISTS "Users can delete own generations" ON public.generations;

-- Create a permissive delete policy that allows deletion
CREATE POLICY "Anyone can delete generations" 
ON public.generations 
FOR DELETE 
USING (true);