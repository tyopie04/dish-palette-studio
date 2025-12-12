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
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface GenerationEntry {
  id: string;
  images: string[];
  timestamp: Date;
  isLoading?: boolean;
  prompt?: string;
  ratio?: string;
  resolution?: string;
}

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
  const { user } = useAuth();
  const { photos: storedPhotos, loading: photosLoading, uploadPhotos, deletePhoto, reorderPhotos, renamePhoto } = useMenuPhotos();
  
  const photos = storedPhotos;
  
  const [selectedPhotos, setSelectedPhotos] = useState<MenuPhoto[]>([]);
  const [generationHistory, setGenerationHistory] = useState<GenerationEntry[]>([]);
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

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActivePhoto(null);
    
    if (event.over?.id === "prompt-bar-drop") {
      const photo = photos.find((p) => p.id === event.active.id);
      if (photo && !selectedPhotos.find((p) => p.id === photo.id)) {
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
    
    setGenerationHistory((prev) => [...newEntries, ...prev]);
    return ids;
  }, []);

  const updateEntryWithImage = useCallback((id: string, image: string) => {
    setGenerationHistory((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, images: [image], isLoading: false } : entry
      )
    );
  }, []);

  const removeLoadingEntry = useCallback((id: string) => {
    setGenerationHistory((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const removeLoadingEntries = useCallback((ids: string[]) => {
    setGenerationHistory((prev) => prev.filter((entry) => !ids.includes(entry.id)));
  }, []);

  const extractImagesFromResponse = (data: any): string[] => {
    if (data?.images && Array.isArray(data.images)) {
      return data.images.filter((img: string) => typeof img === 'string' && img.startsWith('data:image'));
    }
    return [];
  };

  const handleGenerate = useCallback(async (prompt: string) => {
    // Create one loading entry per image being generated
    const loadingIds = addLoadingEntries(selectedPhotoAmount, prompt, selectedRatio, selectedResolution);
    
    try {
      const imagePromises = selectedPhotos.map((p) => compressImageToBase64(p.src));
      const imageUrls = await Promise.all(imagePromises);
      const photoNames = selectedPhotos.map((p) => p.name);
      
      let styleGuideBase64: string | undefined;
      if (styleGuideUrl) {
        styleGuideBase64 = await compressImageToBase64(styleGuideUrl);
      }
      
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt, 
          ratio: selectedRatio, 
          resolution: selectedResolution, 
          photoAmount: selectedPhotoAmount, 
          imageUrls, 
          photoNames, 
          styleGuideUrl: styleGuideBase64,
          userId: user?.id
        }
      });

      if (error) {
        toast.error(error.message || 'Failed to generate content');
        removeLoadingEntries(loadingIds);
        return;
      }

      const images = extractImagesFromResponse(data);
      
      if (images.length > 0) {
        // Update each loading entry with its corresponding image
        images.forEach((image, index) => {
          if (loadingIds[index]) {
            updateEntryWithImage(loadingIds[index], image);
          }
        });
        
        // Remove any extra loading entries that didn't get images
        const unusedIds = loadingIds.slice(images.length);
        if (unusedIds.length > 0) {
          removeLoadingEntries(unusedIds);
        }
        
        toast.success(`Generated ${images.length} image${images.length > 1 ? 's' : ''} successfully!`);
      } else if (data?.error) {
        toast.error(data.error.message || 'AI generation failed');
        removeLoadingEntries(loadingIds);
      } else {
        toast.error('No images were generated');
        removeLoadingEntries(loadingIds);
      }
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Failed to generate content');
      removeLoadingEntries(loadingIds);
    }
  }, [selectedPhotos, selectedRatio, selectedResolution, selectedPhotoAmount, styleGuideUrl, user?.id, addLoadingEntries, updateEntryWithImage, removeLoadingEntries]);

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
    setGenerationHistory((prev) => prev.filter((e) => e.id !== entryId));
    toast.success("Generation deleted");
  }, []);

  const handleToggleSelect = useCallback((imageId: string) => {
    setSelectedImages((prev) => 
      prev.includes(imageId) 
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    );
  }, []);

  const handleRerun = useCallback((entry: { prompt?: string; ratio?: string; resolution?: string }) => {
    if (entry.prompt) {
      if (entry.ratio) setSelectedRatio(entry.ratio);
      if (entry.resolution) setSelectedResolution(entry.resolution);
      handleGenerate(entry.prompt);
    }
  }, [handleGenerate]);

  const handleImageClick = useCallback((image: string, entryData?: { prompt?: string; ratio?: string; resolution?: string; timestamp?: Date; entryId?: string }) => {
    setLightboxImage(image);
    setLightboxMeta(entryData || {});
  }, []);

  const handleEditImage = useCallback((image: string) => {
    setLightboxImage(null);
    setEditingImage(image);
  }, []);

  const handleApplyEdit = useCallback(async (image: string, editPrompt: string) => {
    const loadingIds = addLoadingEntries(1, "Editing...", "Edit", "Original");
    const loadingId = loadingIds[0];
    
    try {
      const { data, error } = await supabase.functions.invoke('edit-image', {
        body: { imageUrl: image, editPrompt }
      });

      if (error) {
        toast.error(error.message || 'Failed to edit image');
        removeLoadingEntry(loadingId);
        return;
      }

      if (data?.image) {
        updateEntryWithImage(loadingId, data.image);
        toast.success("Image edited successfully!");
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
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Left Sidebar - Menu Photos */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
              <aside className="h-full border-r border-border/50 bg-card/30">
                <ScrollArea className="h-[calc(100vh-64px)]">
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
                </ScrollArea>
              </aside>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Main Content - Generated Images */}
            <ResizablePanel defaultSize={80}>
              <main className="h-full flex flex-col overflow-hidden">
                <MasonryGallery
                  history={generationHistory}
                  onImageClick={handleImageClick}
                  onDelete={handleDeleteEntry}
                  onEdit={handleEditImage}
                  onRerun={handleRerun}
                  selectedImages={selectedImages}
                  onToggleSelect={handleToggleSelect}
                />
              </main>
            </ResizablePanel>
          </ResizablePanelGroup>

          {/* Floating Prompt Bar */}
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

        <DragOverlay>{dragOverlayContent}</DragOverlay>
      </DndContext>

      {lightboxImage && (
        <ImageLightbox
          image={lightboxImage}
          onClose={() => setLightboxImage(null)}
          onEdit={() => handleEditImage(lightboxImage)}
          onDelete={lightboxMeta.entryId ? () => handleDeleteEntry(lightboxMeta.entryId!) : undefined}
          onRecreate={lightboxMeta.prompt ? () => handleGenerate(lightboxMeta.prompt!) : undefined}
          prompt={lightboxMeta.prompt}
          ratio={lightboxMeta.ratio}
          resolution={lightboxMeta.resolution}
          timestamp={lightboxMeta.timestamp}
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
