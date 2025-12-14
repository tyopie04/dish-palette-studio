-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Public can view all generations" ON generations;

-- Create a truly permissive policy for SELECT
CREATE POLICY "Public can view all generations" 
ON generations 
FOR SELECT 
TO public 
USING (true);