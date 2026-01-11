-- Add new columns to styles table for centralized style management
ALTER TABLE public.styles
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Studio',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON TABLE public.styles IS 'Centralized data model for all visual styles in the app';

-- Create index for filtering active styles
CREATE INDEX IF NOT EXISTS idx_styles_status ON public.styles(status);
CREATE INDEX IF NOT EXISTS idx_styles_category ON public.styles(category);