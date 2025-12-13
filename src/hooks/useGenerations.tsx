import { useState, useCallback, useEffect } from 'react';
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

export const useGenerations = () => {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<GenerationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGenerations = useCallback(async () => {
    if (!user) {
      setGenerations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedGenerations: GenerationEntry[] = (data || []).map((gen) => ({
        id: gen.id,
        images: gen.images || [],
        timestamp: new Date(gen.created_at),
        prompt: gen.prompt || undefined,
        ratio: gen.ratio || undefined,
        resolution: gen.resolution || undefined,
        isLoading: false,
      }));

      setGenerations(mappedGenerations);
    } catch (error) {
      console.error('Error fetching generations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const loadImagesForEntry = useCallback(async (entryId: string) => {
    setGenerations(prev => prev.map(e =>
      e.id === entryId ? { ...e, isLoading: false } : e
    ));
  }, []);

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

  const updateEntryWithImage = useCallback(async (tempId: string, image: string, metadata?: { prompt?: string; ratio?: string; resolution?: string }) => {
    if (!user) return;

    try {
      // Save to database
      const { data, error } = await supabase
        .from('generations')
        .insert({
          user_id: user.id,
          images: [image],
          prompt: metadata?.prompt,
          ratio: metadata?.ratio,
          resolution: metadata?.resolution,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state - replace temp entry with real one
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
      // Still update UI even if save fails
      setGenerations((prev) =>
        prev.map((e) =>
          e.id === tempId
            ? { ...e, images: [image], isLoading: false }
            : e
        )
      );
    }
  }, [user]);

  const removeLoadingEntry = useCallback((id: string) => {
    setGenerations((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const removeLoadingEntries = useCallback((ids: string[]) => {
    setGenerations((prev) => prev.filter((entry) => !ids.includes(entry.id)));
  }, []);

  const deleteGeneration = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setGenerations((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Error deleting generation:', error);
      toast.error('Failed to delete generation');
    }
  }, [user]);

  const deleteGenerations = useCallback(async (ids: string[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('generations')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;

      setGenerations((prev) => prev.filter((e) => !ids.includes(e.id)));
    } catch (error) {
      console.error('Error deleting generations:', error);
      toast.error('Failed to delete generations');
    }
  }, [user]);

  const clearAllGenerations = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setGenerations([]);
      toast.success('All generations cleared');
    } catch (error) {
      console.error('Error clearing generations:', error);
      toast.error('Failed to clear generations');
    }
  }, [user]);

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
