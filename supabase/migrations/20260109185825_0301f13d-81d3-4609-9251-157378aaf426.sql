-- Create styles table
CREATE TABLE public.styles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    prompt_modifier text NOT NULL,
    thumbnail_url text,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
    has_color_picker boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on styles
ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything on styles
CREATE POLICY "Super admins can view all styles"
ON public.styles FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert styles"
ON public.styles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update styles"
ON public.styles FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete styles"
ON public.styles FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Users can view global styles or their org's styles
CREATE POLICY "Users can view accessible styles"
ON public.styles FOR SELECT
USING (
    organization_id IS NULL 
    OR organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- Create settings table (single row for global settings)
CREATE TABLE public.admin_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    master_prompt text NOT NULL DEFAULT 'Professional food photography style, high quality, appetizing presentation',
    default_resolution text NOT NULL DEFAULT '1K',
    default_ratio text NOT NULL DEFAULT '1:1',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can access settings
CREATE POLICY "Super admins can view settings"
ON public.admin_settings FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update settings"
ON public.admin_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert settings"
ON public.admin_settings FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Insert default settings row
INSERT INTO public.admin_settings (master_prompt, default_resolution, default_ratio)
VALUES ('Professional food photography style, high quality, appetizing presentation', '1K', '1:1');

-- Add triggers for updated_at
CREATE TRIGGER update_styles_updated_at
BEFORE UPDATE ON public.styles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();