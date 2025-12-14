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

  const fetchGenerations = useCallback(async () => {
    // Only fetch once
    if (hasFetched) return;

    console.log('[GENERATIONS] Fetching generations from database...');

    try {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      console.log('[GENERATIONS] Fetch result:', { 
        count: data?.length ?? 0, 
        error: error?.message ?? null,
        firstItem: data?.[0]?.id ?? 'none'
      });

      if (error) {
        console.error('Error fetching generations:', error);
        setLoading(false);
        return;
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
        const newLoadingEntries = loadingEntries.filter(e => !fetchedIds.has(e.id));
        return [...newLoadingEntries, ...mappedGenerations];
      });
      
      setHasFetched(true);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching generations:', error);
      setLoading(false);
    }
  }, [hasFetched]);

  // Only run once on mount
  useEffect(() => {
    fetchGenerations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    console.log('[GENERATIONS] ============ updateEntryWithImage START ============');
    console.log('[GENERATIONS] Step 0: Called with tempId:', tempId);
    console.log('[GENERATIONS] Step 0: Image length:', image?.length);
    console.log('[GENERATIONS] Step 0: Image starts with:', image?.substring(0, 50));
    console.log('[GENERATIONS] Step 0: Is base64:', image?.startsWith('data:image'));
    
    // Update UI immediately with base64 (shows instantly)
    console.log('[GENERATIONS] Step 1: Updating UI state with base64...');
    setGenerations((prev) => {
      const found = prev.some(e => e.id === tempId);
      console.log('[GENERATIONS] Step 1: Found entry:', found, 'Total entries:', prev.length);
      console.log('[GENERATIONS] Step 1: All entry IDs:', prev.map(e => e.id));
      
      if (!found) {
        console.warn('[GENERATIONS] Step 1: Entry NOT FOUND, creating new entry for:', tempId);
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
      
      const updated = prev.map((e) =>
        e.id === tempId
          ? { ...e, images: [image], isLoading: false, ...metadata }
          : e
      );
      console.log('[GENERATIONS] Step 1: State updated. New state:', updated.slice(0, 3).map(e => ({ 
        id: e.id, 
        hasImages: e.images.length > 0, 
        isLoading: e.isLoading,
        imagePreview: e.images[0]?.substring(0, 30)
      })));
      return updated;
    });

    try {
      console.log('[GENERATIONS] Step 2: Starting storage upload...');
      
      // Upload image to storage bucket instead of saving base64 to DB
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
      
      // Convert base64 to blob
      console.log('[GENERATIONS] Step 2a: Converting base64 to binary...');
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      console.log('[GENERATIONS] Step 2a: Binary size:', binaryData.length, 'bytes');
      
      console.log('[GENERATIONS] Step 2b: Uploading to storage bucket...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('generated-images')
        .upload(fileName, binaryData, {
          contentType: 'image/png',
          cacheControl: '31536000',
        });

      console.log('[GENERATIONS] Step 2b: Storage upload result:', { 
        success: !!uploadData,
        uploadError: uploadError?.message, 
        fileName
      });

      if (uploadError) {
        console.error('[GENERATIONS] Step 2b: Storage upload FAILED:', uploadError);
        throw uploadError;
      }

      // Get public URL
      console.log('[GENERATIONS] Step 3: Getting public URL...');
      const { data: urlData } = supabase.storage
        .from('generated-images')
        .getPublicUrl(fileName);
      
      const publicUrl = urlData.publicUrl;
      console.log('[GENERATIONS] Step 3: Got public URL:', publicUrl);

      // Save URL (not base64) to database
      console.log('[GENERATIONS] Step 4: Saving to database...');
      const { data, error } = await supabase
        .from('generations')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000',
          images: [publicUrl],
          prompt: metadata?.prompt,
          ratio: metadata?.ratio,
          resolution: metadata?.resolution,
        })
        .select()
        .single();

      if (error) {
        console.error('[GENERATIONS] Step 4: Database insert FAILED:', error);
        throw error;
      }

      console.log('[GENERATIONS] Step 4: Saved to DB with ID:', data.id);
      
      // Update state with real ID and URL
      console.log('[GENERATIONS] Step 5: Updating state with real ID and URL...');
      setGenerations((prev) => {
        const updated = prev.map((e) =>
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
        );
        console.log('[GENERATIONS] Step 5: Final state after DB save:', updated.slice(0, 3).map(e => ({ 
          id: e.id, 
          hasImages: e.images.length > 0, 
          isLoading: e.isLoading 
        })));
        return updated;
      });
      console.log('[GENERATIONS] ============ updateEntryWithImage COMPLETE ============');
    } catch (error) {
      console.error('[GENERATIONS] ERROR in updateEntryWithImage:', error);
      console.log('[GENERATIONS] Note: Image should still be visible as base64 in UI');
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
