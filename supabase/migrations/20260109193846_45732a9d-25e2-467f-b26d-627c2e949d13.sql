-- Drop existing restrictive SELECT policies on organizations
DROP POLICY IF EXISTS "Super admins can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;

-- Recreate as PERMISSIVE policies (default behavior, OR logic)
CREATE POLICY "Super admins can view all organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can view own organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR owner_id = auth.uid()
);