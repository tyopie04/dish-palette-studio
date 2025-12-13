import { useState, useCallback } from 'react';
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
  const [loading] = useState(false);

  // No-op fetch since we're not using database
  const fetchGenerations = useCallback(async () => {
    // Local only - no database
  }, []);

  // Load images for a single entry (no-op without database)
  const loadImagesForEntry = useCallback(async (entryId: string) => {
    // Mark as loaded
    setGenerations(prev => prev.map(e =>
      e.id === entryId ? { ...e, isLoading: false } : e
    ));
  }, []);

  // Add a loading entry (local only)
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

  // Update a loading entry with the generated image (local only)
  const updateEntryWithImage = useCallback(async (tempId: string, image: string, metadata?: { prompt?: string; ratio?: string; resolution?: string }) => {
    setGenerations((prev) =>
      prev.map((e) =>
        e.id === tempId
          ? {
              ...e,
              images: [image],
              isLoading: false,
              prompt: metadata?.prompt || e.prompt,
              ratio: metadata?.ratio || e.ratio,
              resolution: metadata?.resolution || e.resolution,
            }
          : e
      )
    );
  }, []);

  // Remove a loading entry
  const removeLoadingEntry = useCallback((id: string) => {
    setGenerations((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  // Remove multiple loading entries
  const removeLoadingEntries = useCallback((ids: string[]) => {
    setGenerations((prev) => prev.filter((entry) => !ids.includes(entry.id)));
  }, []);

  // Delete a generation
  const deleteGeneration = useCallback(async (id: string) => {
    setGenerations((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // Delete multiple generations
  const deleteGenerations = useCallback(async (ids: string[]) => {
    setGenerations((prev) => prev.filter((e) => !ids.includes(e.id)));
  }, []);

  // Clear all generations
  const clearAllGenerations = useCallback(async () => {
    setGenerations([]);
    toast.success('All generations cleared');
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
