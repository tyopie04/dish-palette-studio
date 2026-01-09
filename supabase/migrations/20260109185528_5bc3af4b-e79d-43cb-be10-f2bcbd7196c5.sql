-- Add soft delete columns to menu_photos
ALTER TABLE public.menu_photos 
ADD COLUMN deleted_at timestamp with time zone,
ADD COLUMN deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop existing user policies that don't account for deleted items
DROP POLICY IF EXISTS "Users can view own photos" ON public.menu_photos;
DROP POLICY IF EXISTS "Users can delete own photos" ON public.menu_photos;
DROP POLICY IF EXISTS "Users can update own photos" ON public.menu_photos;

-- Recreate policies excluding soft-deleted items for regular users
CREATE POLICY "Users can view own non-deleted photos"
ON public.menu_photos FOR SELECT
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can update own non-deleted photos"
ON public.menu_photos FOR UPDATE
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can soft delete own photos"
ON public.menu_photos FOR UPDATE
USING (auth.uid() = user_id);

-- Super admins can view ALL photos including deleted (for trash management)
DROP POLICY IF EXISTS "Super admins can view all menu photos" ON public.menu_photos;

CREATE POLICY "Super admins can view all menu photos including deleted"
ON public.menu_photos FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can update any photo (for restore functionality)
CREATE POLICY "Super admins can update all menu photos"
ON public.menu_photos FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Super admins can permanently delete photos
CREATE POLICY "Super admins can delete menu photos"
ON public.menu_photos FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));