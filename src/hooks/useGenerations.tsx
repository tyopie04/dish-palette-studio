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
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchGenerations = useCallback(async (retryCount = 0) => {
    // Only fetch once - don't overwrite user-generated content
    if (hasFetched) return;
    
    // Don't fetch if we're actively generating - this prevents race conditions
    if (isGenerating) {
      console.log('[GENERATIONS] Skipping fetch - generation in progress');
      return;
    }

    try {
      // Limit to last 50 generations to prevent timeout on cold starts
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching generations:', error);
        // DON'T set hasFetched on error - allow retries later
        // DON'T update state on error - preserve any existing entries
        setLoading(false);
        return; // Return early, don't touch state
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
      setLoading(false);
    } catch (error) {
      console.error('Error fetching generations:', error);
      // DON'T update state on error - preserve any existing entries
      setLoading(false);
    }
  }, [hasFetched, isGenerating]);

  useEffect(() => {
    // Re-enabled - now fetches URLs instead of base64, should be fast
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
      const id = `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`;
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
      const updated = [...newEntries, ...prev];
      console.log('[GENERATIONS] New state will have:', updated.length, 'entries. IDs:', ids);
      return updated;
    });
    return ids;
  }, []);

  const updateEntryWithImage = useCallback(async (tempId: string, image: string, metadata?: { prompt?: string; ratio?: string; resolution?: string }) => {
    console.log('[GENERATIONS] Updating entry with image:', tempId, 'Image length:', image?.length);
    
    // Update UI immediately with base64 (shows instantly)
    setGenerations((prev) => {
      const found = prev.some(e => e.id === tempId);
      console.log('[GENERATIONS] Updating entry. Found:', found, 'Total entries:', prev.length);
      
      if (!found) {
        console.warn('[GENERATIONS] Entry not found, creating new entry for:', tempId);
        return [
          {
            id: tempId,
            images: [image],
            timestamp: new Date(),
            isLoading: false,
            ...metadata
          },
          ...prev
        ];
      }
      
      return prev.map((e) =>
        e.id === tempId
          ? { ...e, images: [image], isLoading: false, ...metadata }
          : e
      );
    });

    try {
      // Upload image to storage bucket instead of saving base64 to DB
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
      
      // Convert base64 to blob
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      console.log('[GENERATIONS] Uploading to storage:', fileName);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('generated-images')
        .upload(fileName, binaryData, {
          contentType: 'image/png',
          cacheControl: '31536000', // Cache for 1 year
        });

      if (uploadError) {
        console.error('[GENERATIONS] Storage upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('generated-images')
        .getPublicUrl(fileName);
      
      const publicUrl = urlData.publicUrl;
      console.log('[GENERATIONS] Got public URL:', publicUrl);

      // Save URL (not base64) to database
      const { data, error } = await supabase
        .from('generations')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          images: [publicUrl], // Save URL, not base64
          prompt: metadata?.prompt,
          ratio: metadata?.ratio,
          resolution: metadata?.resolution,
        })
        .select()
        .single();

      if (error) throw error;

      // Update state with real ID and URL
      setGenerations((prev) =>
        prev.map((e) =>
          e.id === tempId
            ? {
                id: data.id,
                images: [publicUrl],
                timestamp: new Date(data.created_at),
                isLoading: false,
                prompt: data.prompt || undefined,
                ratio: data.ratio || undefined,
                resolution: data.resolution || undefined,
              }
            : e
        )
      );
      console.log('[GENERATIONS] Saved to DB with URL');
    } catch (error) {
      console.error('Error saving generation:', error);
      // Image is already showing (base64), just log the error
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
    isGenerating,
    setIsGenerating,
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
