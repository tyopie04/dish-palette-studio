import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Header } from "@/components/Header";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PromptBar } from "@/components/PromptBar";
import { MasonryGallery } from "@/components/MasonryGallery";
import { ImageLightbox } from "@/components/ImageLightbox";
import { ImageEditDialog } from "@/components/ImageEditDialog";
import { MenuPhoto } from "@/components/PhotoCard";
import { useMenuPhotos, MenuPhoto as StoredMenuPhoto } from "@/hooks/useMenuPhotos";
import { useGenerations, GenerationEntry } from "@/hooks/useGenerations";

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

// Higher quality image processing for AI generation (max 4096px for better quality)
const compressImageToBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 4096;
      let width = img.width;
      let height = img.height;
      
      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL("image/jpeg", 0.92);
      resolve(base64);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
};

const Index = () => {
  const { photos: storedPhotos, loading: photosLoading, uploadPhotos, deletePhoto, reorderPhotos, renamePhoto } = useMenuPhotos();
  const { 
    generations: generationHistory, 
    addLoadingEntries, 
    updateEntryWithImage, 
    removeLoadingEntry, 
    removeLoadingEntries, 
    deleteGeneration,
    deleteGenerations,
    loadImagesForEntry,
    clearAllGenerations,
    setIsGenerating,
  } = useGenerations();
  
  const photos = storedPhotos;
  
  const [selectedPhotos, setSelectedPhotos] = useState<MenuPhoto[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  
  const [activePhoto, setActivePhoto] = useState<MenuPhoto | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxMeta, setLightboxMeta] = useState<{ 
    prompt?: string; 
    ratio?: string; 
    resolution?: string;
    timestamp?: Date;
    entryId?: string;
  }>({});
  const [editingImage, setEditingImage] = useState<string | null>(null);
  
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedResolution, setSelectedResolution] = useState("2K");
  const [selectedPhotoAmount, setSelectedPhotoAmount] = useState(1);
  const [styleGuideUrl, setStyleGuideUrl] = useState<string | null>(null);
  const [photoSize, setPhotoSize] = useState<"small" | "medium" | "large">("medium");

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const photo = photos.find((p) => p.id === event.active.id);
    if (photo) {
      setActivePhoto({
        id: photo.id,
        name: photo.name,
        src: photo.src,
        category: photo.category,
      });
    }
  }, [photos]);

  const MAX_SELECTED_PHOTOS = 8;

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActivePhoto(null);
    
    if (event.over?.id === "prompt-bar-drop") {
      const photo = photos.find((p) => p.id === event.active.id);
      if (photo && !selectedPhotos.find((p) => p.id === photo.id)) {
        if (selectedPhotos.length >= MAX_SELECTED_PHOTOS) {
          toast.error("Maximum 8 photos allowed");
          return;
        }
        setSelectedPhotos((prev) => [...prev, {
          id: photo.id,
          name: photo.name,
          src: photo.src,
          category: photo.category,
        }]);
        toast.success(`Added ${photo.name} to prompt`);
      }
    }
  }, [photos, selectedPhotos]);

  const handlePhotoClick = useCallback((photo: StoredMenuPhoto) => {
    if (!selectedPhotos.find((p) => p.id === photo.id)) {
      if (selectedPhotos.length >= MAX_SELECTED_PHOTOS) {
        toast.error("Maximum 8 photos allowed");
        return;
      }
      setSelectedPhotos((prev) => [...prev, {
        id: photo.id,
        name: photo.name,
        src: photo.src,
        category: photo.category,
      }]);
      toast.success(`Added ${photo.name} to prompt`);
    } else {
      toast.info(`${photo.name} is already in the prompt`);
    }
  }, [selectedPhotos]);

  const handleRemovePhoto = useCallback((id: string) => {
    setSelectedPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const extractImagesFromResponse = (data: any): string[] => {
    if (data?.images && Array.isArray(data.images)) {
      return data.images.filter((img: string) => typeof img === 'string' && img.startsWith('data:image'));
    }
    return [];
  };

  const handleGenerate = useCallback(async (prompt: string) => {
    console.log('[GENERATE] Starting generation with', selectedPhotos.length, 'photos');
    
    // Set generating flag to prevent fetchGenerations from running
    setIsGenerating(true);
    
    // Create one loading entry per image being generated
    const loadingIds = addLoadingEntries(selectedPhotoAmount, prompt, selectedRatio, selectedResolution);
    console.log('[GENERATE] Created loading entries:', loadingIds);
    
    // Small delay to ensure state update has propagated
    await new Promise(resolve => setTimeout(resolve, 50));
    
    try {
      console.log('[GENERATE] Compressing images...');
      const imagePromises = selectedPhotos.map((p) => compressImageToBase64(p.src));
      const imageUrls = await Promise.all(imagePromises);
      console.log('[GENERATE] Compressed', imageUrls.length, 'images');
      const photoNames = selectedPhotos.map((p) => p.name);
      
      let styleGuideBase64: string | undefined;
      if (styleGuideUrl) {
        styleGuideBase64 = await compressImageToBase64(styleGuideUrl);
      }
      
      console.log('[GENERATE] Calling edge function...');
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt, 
          ratio: selectedRatio, 
          resolution: selectedResolution, 
          photoAmount: selectedPhotoAmount, 
          imageUrls, 
          photoNames, 
          styleGuideUrl: styleGuideBase64,
        }
      });
      console.log('[GENERATE] Edge function response:', { hasData: !!data, hasError: !!error, dataKeys: data ? Object.keys(data) : [] });

      if (error) {
        console.error('[GENERATE] Edge function error:', error);
        toast.error(error.message || 'Failed to generate content');
        removeLoadingEntries(loadingIds);
        return;
      }

      const images = extractImagesFromResponse(data);
      console.log('[GENERATE] Extracted', images.length, 'images from response');
      
      if (images.length > 0) {
        console.log('[GENERATE] About to update entries. Loading IDs:', loadingIds, 'Images:', images.length);
        
        // Update each loading entry with its corresponding image
        images.forEach((image, index) => {
          const tempId = loadingIds[index];
          console.log('[GENERATE] Updating entry', tempId, 'with image of length', image?.length);
          if (tempId && image) {
            updateEntryWithImage(tempId, image, { prompt, ratio: selectedRatio, resolution: selectedResolution });
          } else {
            console.error('[GENERATE] Missing tempId or image:', { tempId, hasImage: !!image });
          }
        });
        
        // Remove any extra loading entries that didn't get images
        const unusedIds = loadingIds.slice(images.length);
        if (unusedIds.length > 0) {
          removeLoadingEntries(unusedIds);
        }
        
        toast.success(`Generated ${images.length} image${images.length > 1 ? 's' : ''} successfully!`);
      } else if (data?.error) {
        console.error('[GENERATE] AI error in response:', data.error);
        toast.error(data.error.message || 'AI generation failed');
        removeLoadingEntries(loadingIds);
      } else {
        console.error('[GENERATE] No images in response. Data:', JSON.stringify(data).slice(0, 500));
        toast.error('No images were generated');
        removeLoadingEntries(loadingIds);
      }
    } catch (err) {
      console.error('[GENERATE] Exception:', err);
      toast.error('Failed to generate content');
      removeLoadingEntries(loadingIds);
    } finally {
      // Clear generating flag after completion
      setIsGenerating(false);
    }
  }, [selectedPhotos, selectedRatio, selectedResolution, selectedPhotoAmount, styleGuideUrl, addLoadingEntries, updateEntryWithImage, removeLoadingEntries, setIsGenerating]);

  const handlePhotosAdded = useCallback((files: File[]) => {
    uploadPhotos(files);
  }, [uploadPhotos]);

  const handleDeletePhoto = useCallback((id: string) => {
    if (id.startsWith("default-")) {
      toast.error("Cannot delete example photos. Upload your own to replace them.");
      return;
    }
    deletePhoto(id);
    setSelectedPhotos((prev) => prev.filter((p) => p.id !== id));
  }, [deletePhoto]);

  const handleReorder = useCallback((newPhotos: StoredMenuPhoto[]) => {
    if (newPhotos.some(p => p.id.startsWith("default-"))) {
      return;
    }
    reorderPhotos(newPhotos);
  }, [reorderPhotos]);

  const handleRenamePhoto = useCallback((id: string, newName: string) => {
    renamePhoto(id, newName);
    setSelectedPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
  }, [renamePhoto]);

  const handleDeleteEntry = useCallback((entryId: string) => {
    deleteGeneration(entryId);
    toast.success("Generation deleted");
  }, [deleteGeneration]);

  const handleToggleSelect = useCallback((imageId: string) => {
    setSelectedImages((prev) => 
      prev.includes(imageId) 
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    );
  }, []);

  const handleDownloadSelected = useCallback(async () => {
    for (const imageId of selectedImages) {
      // Find the image URL from generationHistory
      for (const entry of generationHistory) {
        for (let idx = 0; idx < entry.images.length; idx++) {
          const id = `${entry.id}-${idx}`;
          if (id === imageId) {
            const imageUrl = entry.images[idx];
            try {
              if (imageUrl.startsWith('data:')) {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = `generated-${Date.now()}-${idx}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } else {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `generated-${Date.now()}-${idx}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              }
            } catch (error) {
              console.error('Download failed:', error);
            }
          }
        }
      }
    }
    toast.success(`Downloaded ${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''}`);
    setSelectedImages([]);
  }, [selectedImages, generationHistory]);

  const handleDeleteSelected = useCallback(async () => {
    const entryIdsToDelete: string[] = [];
    for (const imageId of selectedImages) {
      const entryId = imageId.split('-').slice(0, -1).join('-');
      if (!entryIdsToDelete.includes(entryId)) {
        entryIdsToDelete.push(entryId);
      }
    }
    await deleteGenerations(entryIdsToDelete);
    toast.success(`Deleted ${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''}`);
    setSelectedImages([]);
  }, [selectedImages, deleteGenerations]);

  const handleRerun = useCallback((entry: { prompt?: string; ratio?: string; resolution?: string }) => {
    if (entry.prompt) {
      if (entry.ratio) setSelectedRatio(entry.ratio);
      if (entry.resolution) setSelectedResolution(entry.resolution);
      handleGenerate(entry.prompt);
    }
  }, [handleGenerate]);

  // Create a flat list of all completed images for navigation
  const allCompletedImages = useMemo(() => {
    const images: Array<{
      image: string;
      prompt?: string;
      ratio?: string;
      resolution?: string;
      timestamp?: Date;
      entryId: string;
    }> = [];
    
    generationHistory
      .filter(entry => !entry.isLoading && entry.images.length > 0)
      .forEach(entry => {
        entry.images.forEach((img) => {
          images.push({
            image: img,
            prompt: entry.prompt,
            ratio: entry.ratio,
            resolution: entry.resolution,
            timestamp: entry.timestamp,
            entryId: entry.id
          });
        });
      });
    
    return images;
  }, [generationHistory]);

  const [currentImageIndex, setCurrentImageIndex] = useState<number>(-1);

  const handleImageClick = useCallback((image: string, entryData?: { prompt?: string; ratio?: string; resolution?: string; timestamp?: Date; entryId?: string }) => {
    setLightboxImage(image);
    setLightboxMeta(entryData || {});
    
    // Find the index of this image in allCompletedImages
    const index = allCompletedImages.findIndex(item => item.image === image);
    setCurrentImageIndex(index);
  }, [allCompletedImages]);

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentImageIndex - 1 : currentImageIndex + 1;
    if (newIndex >= 0 && newIndex < allCompletedImages.length) {
      const item = allCompletedImages[newIndex];
      setLightboxImage(item.image);
      setLightboxMeta({
        prompt: item.prompt,
        ratio: item.ratio,
        resolution: item.resolution,
        timestamp: item.timestamp,
        entryId: item.entryId
      });
      setCurrentImageIndex(newIndex);
    }
  }, [currentImageIndex, allCompletedImages]);

  const handleEditImage = useCallback((image: string) => {
    setLightboxImage(null);
    setEditingImage(image);
  }, []);

  // Valid Gemini aspect ratios
  const VALID_ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
  
  const getNearestValidRatio = (width: number, height: number): string => {
    const targetRatio = width / height;
    let closest = '1:1';
    let minDiff = Infinity;
    
    for (const ratio of VALID_ASPECT_RATIOS) {
      const [w, h] = ratio.split(':').map(Number);
      const ratioValue = w / h;
      const diff = Math.abs(ratioValue - targetRatio);
      if (diff < minDiff) {
        minDiff = diff;
        closest = ratio;
      }
    }
    return closest;
  };

  const handleApplyEdit = useCallback(async (image: string, editPrompt: string) => {
    // Detect the source image's aspect ratio and resolution
    const getSourceInfo = (): Promise<{ ratio: string; resolution: string }> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const width = img.naturalWidth;
          const height = img.naturalHeight;
          
          // Map to nearest valid Gemini aspect ratio
          const ratio = getNearestValidRatio(width, height);
          
          // Determine resolution tier based on longest edge
          const longestEdge = Math.max(width, height);
          let resolution: string;
          if (longestEdge >= 3000) {
            resolution = "4K";
          } else if (longestEdge >= 1500) {
            resolution = "2K";
          } else {
            resolution = "1K";
          }
          
          resolve({ ratio, resolution });
        };
        img.onerror = () => resolve({ ratio: "1:1", resolution: "1K" });
        img.src = image;
      });
    };

    const sourceInfo = await getSourceInfo();
    const loadingIds = addLoadingEntries(1, "Editing...", sourceInfo.ratio, sourceInfo.resolution);
    const loadingId = loadingIds[0];
    
    try {
      const { data, error } = await supabase.functions.invoke('edit-image', {
        body: { 
          imageUrl: image, 
          editPrompt,
          resolution: sourceInfo.resolution,
          aspectRatio: sourceInfo.ratio
        }
      });

      if (error) {
        toast.error(error.message || 'Failed to edit image');
        removeLoadingEntry(loadingId);
        return;
      }

      if (data?.image) {
        // Detect the actual aspect ratio of the edited image
        const img = new Image();
        img.onload = () => {
          const width = img.naturalWidth;
          const height = img.naturalHeight;
          const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
          const divisor = gcd(width, height);
          const ratioW = width / divisor;
          const ratioH = height / divisor;
          const ratio = `${ratioW}:${ratioH}`;
          
          updateEntryWithImage(loadingId, data.image, { prompt: editPrompt, ratio, resolution: sourceInfo.resolution });
          toast.success("Image edited successfully!");
        };
        img.onerror = () => {
          updateEntryWithImage(loadingId, data.image, { prompt: editPrompt, ratio: sourceInfo.ratio, resolution: sourceInfo.resolution });
          toast.success("Image edited successfully!");
        };
        img.src = data.image;
      } else {
        toast.error('No edited image was returned');
        removeLoadingEntry(loadingId);
      }
    } catch (err) {
      console.error('Edit error:', err);
      toast.error('Failed to edit image');
      removeLoadingEntry(loadingId);
    }
  }, [addLoadingEntries, updateEntryWithImage, removeLoadingEntry]);

  const dragOverlayContent = useMemo(() => {
    if (!activePhoto) return null;
    return (
      <div className="w-24 h-24 rounded-lg overflow-hidden shadow-2xl opacity-80 pointer-events-none">
        <img
          src={activePhoto.src}
          alt={activePhoto.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }, [activePhoto]);

  const activeGenerations = generationHistory.filter(entry => entry.isLoading).length;
  const isGenerating = activeGenerations >= 8;

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
          <Header />
          
          <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0 w-full">
            {/* Left Sidebar - Menu Photos - Independent scroll */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
              <aside className="h-full border-r border-border/50 bg-card/30 overflow-y-auto overflow-x-hidden">
                <div className="p-4">
                  <PhotoGallery 
                    photos={photos} 
                    onPhotosAdded={handlePhotosAdded} 
                    onDeletePhoto={handleDeletePhoto}
                    onPhotoClick={handlePhotoClick}
                    onReorder={handleReorder}
                    onRenamePhoto={handleRenamePhoto}
                    loading={photosLoading}
                    photoSize={photoSize}
                    onPhotoSizeChange={setPhotoSize}
                  />
                </div>
              </aside>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Main Content - Generated Images - Independent scroll */}
            <ResizablePanel defaultSize={80}>
              <div className="h-full relative">
                <main className="h-full overflow-y-auto overflow-x-hidden">
                  {(() => {
                    console.log('[INDEX] Passing to MasonryGallery:', generationHistory.length, 'generations');
                    console.log('[INDEX] Generations data:', generationHistory.map(g => ({ id: g.id, images: g.images?.length, isLoading: g.isLoading })));
                    return null;
                  })()}
                  <MasonryGallery
                    history={generationHistory}
                    onImageClick={handleImageClick}
                    onDelete={handleDeleteEntry}
                    onEdit={handleEditImage}
                    onRerun={handleRerun}
                    selectedImages={selectedImages}
                    onToggleSelect={handleToggleSelect}
                    onDeleteSelected={handleDeleteSelected}
                    onDownloadSelected={handleDownloadSelected}
                    onLoadImages={loadImagesForEntry}
                    onClearAll={clearAllGenerations}
                  />
                </main>
                
                {/* Floating Prompt Bar - absolute positioned at bottom of panel */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-50 px-4">
                  <div className="pointer-events-auto w-full max-w-6xl">
                    <PromptBar
                      selectedPhotos={selectedPhotos}
                      onRemovePhoto={handleRemovePhoto}
                      onGenerate={handleGenerate}
                      isGenerating={isGenerating}
                      ratio={selectedRatio}
                      setRatio={setSelectedRatio}
                      resolution={selectedResolution}
                      setResolution={setSelectedResolution}
                      photoAmount={selectedPhotoAmount}
                      setPhotoAmount={setSelectedPhotoAmount}
                      styleGuideUrl={styleGuideUrl}
                      setStyleGuideUrl={setStyleGuideUrl}
                      loadingCount={activeGenerations}
                    />
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        <DragOverlay>{dragOverlayContent}</DragOverlay>
      </DndContext>

      {lightboxImage && (
        <ImageLightbox
          image={lightboxImage}
          onClose={() => { setLightboxImage(null); setCurrentImageIndex(-1); }}
          onEdit={() => handleEditImage(lightboxImage)}
          onDelete={lightboxMeta.entryId ? () => handleDeleteEntry(lightboxMeta.entryId!) : undefined}
          onRecreate={lightboxMeta.prompt ? () => handleGenerate(lightboxMeta.prompt!) : undefined}
          prompt={lightboxMeta.prompt}
          ratio={lightboxMeta.ratio}
          resolution={lightboxMeta.resolution}
          timestamp={lightboxMeta.timestamp}
          onNavigate={handleNavigate}
          hasPrev={currentImageIndex > 0}
          hasNext={currentImageIndex < allCompletedImages.length - 1}
        />
      )}

      {editingImage && (
        <ImageEditDialog
          image={editingImage}
          isOpen={!!editingImage}
          onClose={() => setEditingImage(null)}
          onEdit={handleApplyEdit}
        />
      )}
    </>
  );
};

export default Index;
