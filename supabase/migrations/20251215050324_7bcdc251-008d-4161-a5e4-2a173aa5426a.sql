-- Remove the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view all generations" ON public.generations;