import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface GenerationEntry {
  id: string;
  images: string[];
  timestamp: Date;
  isLoading?: boolean;
  prompt?: string;
  ratio?: string;
  resolution?: string;
}

interface DbGeneration {
  id: string;
  user_id: string;
  images: string[];
  prompt: string | null;
  ratio: string | null;
  resolution: string | null;
  created_at: string;
}

export const useGenerations = () => {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<GenerationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Two-phase fetch: metadata first (fast), then images in batches
  useEffect(() => {
    const fetchGenerations = async () => {
      if (!user?.id) {
        setGenerations([]);
        setLoading(false);
        return;
      }

      try {
        // Phase 1: Fetch only metadata (no images) - this is fast
        const { data: metaData, error: metaError } = await supabase
          .from('generations')
          .select('id, prompt, ratio, resolution, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (metaError) {
          console.error('Error fetching generations metadata:', metaError);
          toast.error('Failed to load generations');
          setLoading(false);
          return;
        }

        // Create entries with placeholder for images (showing as loading)
        const entries: GenerationEntry[] = (metaData || []).map((g) => ({
          id: g.id,
          images: [],
          timestamp: new Date(g.created_at),
          prompt: g.prompt || undefined,
          ratio: g.ratio || undefined,
          resolution: g.resolution || undefined,
          isLoading: true, // Mark as loading until images load
        }));

        setGenerations((prev) => {
          const loadingEntries = prev.filter(e => e.isLoading && e.id.startsWith('gen-'));
          return [...loadingEntries, ...entries];
        });
        setLoading(false);

        // Phase 2: Lazy load images in small batches
        const ids = (metaData || []).map((g) => g.id);
        const BATCH_SIZE = 2;
        
        for (let i = 0; i < ids.length; i += BATCH_SIZE) {
          const batchIds = ids.slice(i, i + BATCH_SIZE);
          
          const { data: imageData, error: imageError } = await supabase
            .from('generations')
            .select('id, images')
            .in('id', batchIds);

          if (imageError) {
            console.error('Error fetching images batch:', imageError);
            continue;
          }

          // Update entries with loaded images
          setGenerations((prev) =>
            prev.map((entry) => {
              const loaded = imageData?.find((d) => d.id === entry.id);
              if (loaded) {
                return { ...entry, images: loaded.images || [], isLoading: false };
              }
              return entry;
            })
          );
        }
      } catch (err) {
        console.error('Error fetching generations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGenerations();
  }, [user?.id]);

  // Add a loading entry (local only, not persisted)
  const addLoadingEntry = useCallback((id: string, prompt?: string, ratio?: string, resolution?: string) => {
    const newEntry: GenerationEntry = {
      id,
      images: [],
      timestamp: new Date(),
      isLoading: true,
      prompt,
      ratio,
      resolution,
    };
    setGenerations((prev) => [newEntry, ...prev]);
  }, []);

  // Add multiple loading entries
  const addLoadingEntries = useCallback((count: number, prompt?: string, ratio?: string, resolution?: string) => {
    const ids: string[] = [];
    const newEntries: GenerationEntry[] = [];
    
    for (let i = 0; i < count; i++) {
      const id = `gen-${Date.now()}-${i}`;
      ids.push(id);
      newEntries.push({
        id,
        images: [],
        timestamp: new Date(),
        isLoading: true,
        prompt,
        ratio,
        resolution,
      });
    }
    
    setGenerations((prev) => [...newEntries, ...prev]);
    return ids;
  }, []);

  // Update a loading entry with the generated image and persist to database
  const updateEntryWithImage = useCallback(async (tempId: string, image: string, metadata?: { prompt?: string; ratio?: string; resolution?: string }) => {
    if (!user?.id) return;

    try {
      // Insert into database
      const { data, error } = await supabase
        .from('generations')
        .insert({
          user_id: user.id,
          images: [image],
          prompt: metadata?.prompt || null,
          ratio: metadata?.ratio || null,
          resolution: metadata?.resolution || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving generation:', error);
        // Still update the UI even if DB save fails
        setGenerations((prev) =>
          prev.map((e) =>
            e.id === tempId ? { ...e, images: [image], isLoading: false } : e
          )
        );
        return;
      }

      // Update local state with the real database ID
      setGenerations((prev) =>
        prev.map((e) =>
          e.id === tempId
            ? {
                id: data.id,
                images: [image],
                timestamp: new Date(data.created_at),
                isLoading: false,
                prompt: data.prompt || undefined,
                ratio: data.ratio || undefined,
                resolution: data.resolution || undefined,
              }
            : e
        )
      );
    } catch (err) {
      console.error('Error saving generation:', err);
      // Still update the UI
      setGenerations((prev) =>
        prev.map((e) =>
          e.id === tempId ? { ...e, images: [image], isLoading: false } : e
        )
      );
    }
  }, [user?.id]);

  // Remove a loading entry (local only)
  const removeLoadingEntry = useCallback((id: string) => {
    setGenerations((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  // Remove multiple loading entries
  const removeLoadingEntries = useCallback((ids: string[]) => {
    setGenerations((prev) => prev.filter((entry) => !ids.includes(entry.id)));
  }, []);

  // Delete a generation from the database
  const deleteGeneration = useCallback(async (id: string) => {
    // First remove from UI
    setGenerations((prev) => prev.filter((e) => e.id !== id));

    // Check if it's a temp ID (not yet in DB)
    if (id.startsWith('gen-')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting generation:', error);
        toast.error('Failed to delete from database');
      }
    } catch (err) {
      console.error('Error deleting generation:', err);
    }
  }, []);

  // Delete multiple generations
  const deleteGenerations = useCallback(async (ids: string[]) => {
    // Remove from UI first
    setGenerations((prev) => prev.filter((e) => !ids.includes(e.id)));

    // Filter out temp IDs
    const dbIds = ids.filter((id) => !id.startsWith('gen-'));
    
    if (dbIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('generations')
        .delete()
        .in('id', dbIds);

      if (error) {
        console.error('Error deleting generations:', error);
        toast.error('Failed to delete from database');
      }
    } catch (err) {
      console.error('Error deleting generations:', err);
    }
  }, []);

  return {
    generations,
    loading,
    addLoadingEntry,
    addLoadingEntries,
    updateEntryWithImage,
    removeLoadingEntry,
    removeLoadingEntries,
    deleteGeneration,
    deleteGenerations,
    setGenerations,
  };
};
