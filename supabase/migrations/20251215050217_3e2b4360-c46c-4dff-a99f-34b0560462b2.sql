-- Fix the delete policy to only allow users to delete their own generations
DROP POLICY IF EXISTS "Anyone can delete generations" ON public.generations;

-- Create proper delete policy that only allows users to delete their own generations
CREATE POLICY "Users can delete own generations" 
ON public.generations 
FOR DELETE 
USING (auth.uid() = user_id);