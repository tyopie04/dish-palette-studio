import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

export const useGenerations = () => {
  const [generations, setGenerations] = useState<GenerationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchGenerations = useCallback(async (retryCount = 0) => {
    // Only fetch once - don't overwrite user-generated content
    if (hasFetched) return;

    try {
      // Limit to last 50 generations to prevent timeout on cold starts
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Retry on timeout errors
        if (error.code === '57014' && retryCount < 3) {
          console.log(`Retrying fetch (attempt ${retryCount + 1}/3)...`);
          await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
          return fetchGenerations(retryCount + 1);
        }
        throw error;
      }

      const mappedGenerations: GenerationEntry[] = (data || []).map((gen) => ({
        id: gen.id,
        images: gen.images || [],
        timestamp: new Date(gen.created_at),
        prompt: gen.prompt || undefined,
        ratio: gen.ratio || undefined,
        resolution: gen.resolution || undefined,
        isLoading: false,
      }));

      // MERGE with existing loading entries instead of replacing
      setGenerations((prev) => {
        const loadingEntries = prev.filter(e => e.isLoading || e.id.startsWith('gen-'));
        const fetchedIds = new Set(mappedGenerations.map(g => g.id));
        // Keep loading entries that aren't in fetched data
        const newLoadingEntries = loadingEntries.filter(e => !fetchedIds.has(e.id));
        return [...newLoadingEntries, ...mappedGenerations];
      });
      
      setHasFetched(true);
    } catch (error) {
      console.error('Error fetching generations:', error);
      // Don't block the UI - user can still generate new ones
      setHasFetched(true); // Mark as fetched to prevent retries
    } finally {
      setLoading(false);
    }
  }, [hasFetched]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const loadImagesForEntry = useCallback(async (entryId: string) => {
    setGenerations(prev => prev.map(e =>
      e.id === entryId ? { ...e, isLoading: false } : e
    ));
  }, []);

  const addLoadingEntry = useCallback((id: string, prompt?: string, ratio?: string, resolution?: string) => {
    console.log('[GENERATIONS] Adding loading entry:', id);
    const newEntry: GenerationEntry = {
      id,
      images: [],
      timestamp: new Date(),
      isLoading: true,
      prompt,
      ratio,
      resolution,
    };
    setGenerations((prev) => {
      console.log('[GENERATIONS] State update - adding entry. Previous count:', prev.length);
      return [newEntry, ...prev];
    });
  }, []);

  const addLoadingEntries = useCallback((count: number, prompt?: string, ratio?: string, resolution?: string) => {
    console.log('[GENERATIONS] Adding', count, 'loading entries');
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
    
    setGenerations((prev) => {
      console.log('[GENERATIONS] State update - adding entries. Previous count:', prev.length, 'Adding:', newEntries.length);
      return [...newEntries, ...prev];
    });
    return ids;
  }, []);

  const updateEntryWithImage = useCallback(async (tempId: string, image: string, metadata?: { prompt?: string; ratio?: string; resolution?: string }) => {
    console.log('[GENERATIONS] Updating entry with image:', tempId, 'Image length:', image?.length);
    // Update UI immediately first
    setGenerations((prev) => {
      console.log('[GENERATIONS] Updating entry. Found:', prev.some(e => e.id === tempId));
      return prev.map((e) =>
        e.id === tempId
          ? { ...e, images: [image], isLoading: false, ...metadata }
          : e
      );
    });

    try {
      // Save to database in background
      const { data, error } = await supabase
        .from('generations')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          images: [image],
          prompt: metadata?.prompt,
          ratio: metadata?.ratio,
          resolution: metadata?.resolution,
        })
        .select()
        .single();

      if (error) throw error;

      // Update with real ID from database
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
    } catch (error) {
      console.error('Error saving generation:', error);
      // Image is already showing, just log the error
    }
  }, []);

  const removeLoadingEntry = useCallback((id: string) => {
    setGenerations((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const removeLoadingEntries = useCallback((ids: string[]) => {
    setGenerations((prev) => prev.filter((entry) => !ids.includes(entry.id)));
  }, []);

  const deleteGeneration = useCallback(async (id: string) => {
    // Update UI immediately
    setGenerations((prev) => prev.filter((e) => e.id !== id));
    
    try {
      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting generation:', error);
      toast.error('Failed to delete generation');
    }
  }, []);

  const deleteGenerations = useCallback(async (ids: string[]) => {
    // Update UI immediately
    setGenerations((prev) => prev.filter((e) => !ids.includes(e.id)));
    
    try {
      const { error } = await supabase
        .from('generations')
        .delete()
        .in('id', ids);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting generations:', error);
      toast.error('Failed to delete generations');
    }
  }, []);

  const clearAllGenerations = useCallback(async () => {
    // Update UI immediately
    setGenerations([]);
    
    try {
      const { error } = await supabase
        .from('generations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      toast.success('All generations cleared');
    } catch (error) {
      console.error('Error clearing generations:', error);
      toast.error('Failed to clear generations');
    }
  }, []);

  return {
    generations,
    loading,
    fetchGenerations,
    loadImagesForEntry,
    addLoadingEntry,
    addLoadingEntries,
    updateEntryWithImage,
    removeLoadingEntry,
    removeLoadingEntries,
    deleteGeneration,
    deleteGenerations,
    clearAllGenerations,
    setGenerations,
  };
};
