-- Allow super admins to view all generations
CREATE POLICY "Super admins can view all generations"
ON public.generations
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow super admins to view all menu photos
CREATE POLICY "Super admins can view all menu photos"
ON public.menu_photos
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow super admins to view all profiles
CREATE POLICY "Super admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));