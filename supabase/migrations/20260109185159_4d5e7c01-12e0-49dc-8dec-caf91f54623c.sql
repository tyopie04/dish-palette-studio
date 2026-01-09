-- Create organizations table
CREATE TABLE public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    primary_color text DEFAULT '#ff6b35',
    logo_url text,
    owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    disabled boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add organization_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Add organization_id to generations
ALTER TABLE public.generations 
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Add organization_id to menu_photos
ALTER TABLE public.menu_photos 
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything on organizations
CREATE POLICY "Super admins can view all organizations"
ON public.organizations FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert organizations"
ON public.organizations FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update organizations"
ON public.organizations FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete organizations"
ON public.organizations FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Users can view their own organization
CREATE POLICY "Users can view own organization"
ON public.organizations FOR SELECT
USING (
    id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR owner_id = auth.uid()
);

-- Create updated_at trigger for organizations
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();