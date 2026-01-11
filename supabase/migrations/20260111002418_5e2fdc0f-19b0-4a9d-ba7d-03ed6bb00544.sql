-- Add style tracking columns to generations table for auditability
ALTER TABLE public.generations 
ADD COLUMN style_id uuid REFERENCES public.styles(id) ON DELETE SET NULL,
ADD COLUMN style_snapshot jsonb;

-- Add comment explaining the columns
COMMENT ON COLUMN public.generations.style_id IS 'Reference to the style used at generation time (may be null if style was deleted)';
COMMENT ON COLUMN public.generations.style_snapshot IS 'Snapshot of the style settings at generation time including name and prompt_modifier for auditability';