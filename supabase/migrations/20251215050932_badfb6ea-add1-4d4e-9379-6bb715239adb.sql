-- Remove the overly permissive public INSERT policy
DROP POLICY IF EXISTS "Public can insert generations" ON public.generations;