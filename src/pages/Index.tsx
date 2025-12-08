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
import { PromptBuilder } from "@/components/PromptBuilder";
import { GenerationHistory, GenerationEntry } from "@/components/GenerationHistory";
import { ImageLightbox } from "@/components/ImageLightbox";
import { ImageEditDialog } from "@/components/ImageEditDialog";
import { PhotoCard, MenuPhoto } from "@/components/PhotoCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// ============================================
// PERMANENT MENU PHOTOS - DO NOT MODIFY OR DELETE
// These are the user's custom burger images that should
// always remain as the default stock photos.
// ============================================
import menu1 from "@/assets/menu-1.jpg";
import menu2 from "@/assets/menu-2.jpg";
import menu3 from "@/assets/menu-3.jpg";
import menu4 from "@/assets/menu-4.jpg";
import menu5 from "@/assets/menu-5.jpg";
import menu6 from "@/assets/menu-6.jpg";

// PERMANENT DEFAULT PHOTOS - DO NOT MODIFY THIS ARRAY
const initialPhotos: MenuPhoto[] = [
  { id: "1", name: "Signature Burger 1", src: menu1, category: "Burgers" },
  { id: "2", name: "Signature Burger 2", src: menu2, category: "Burgers" },
  { id: "3", name: "Signature Burger 3", src: menu3, category: "Burgers" },
  { id: "4", name: "Signature Burger 4", src: menu4, category: "Burgers" },
  { id: "5", name: "Signature Burger 5", src: menu5, category: "Burgers" },
  { id: "6", name: "Signature Burger 6", src: menu6, category: "Burgers" },
];

// Higher quality image processing for AI generation (max 2048px, PNG format)
const compressImageToBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 2048;
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
      ctx.drawImage(img, 0, 0, width, height);
      const base64 = canvas.toDataURL("image/png");
      resolve(base64);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
};

const Index = () => {
  const [photos, setPhotos] = useState<MenuPhoto[]>(initialPhotos);
  const [selectedPhotos, setSelectedPhotos] = useState<MenuPhoto[]>([]);
  const [generationHistory, setGenerationHistory] = useState<GenerationEntry[]>([]);
  
  const [activePhoto, setActivePhoto] = useState<MenuPhoto | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  
  // Lifted state for ratio/resolution/photo amount/style guide so random generation can use them
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedResolution, setSelectedResolution] = useState("2K");
  const [selectedPhotoAmount, setSelectedPhotoAmount] = useState("1");
  const [styleGuideUrl, setStyleGuideUrl] = useState<string | null>(null);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8,
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const photo = photos.find((p) => p.id === event.active.id);
    if (photo) {
      setActivePhoto(photo);
    }
  }, [photos]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActivePhoto(null);
    
    // Check if dropped over prompt-builder or any area (more lenient drop detection)
    if (event.over?.id === "prompt-builder" || event.delta.x !== 0 || event.delta.y !== 0) {
      const photo = photos.find((p) => p.id === event.active.id);
      // Only add if dropped over prompt-builder area specifically
      if (event.over?.id === "prompt-builder" && photo && !selectedPhotos.find((p) => p.id === photo.id)) {
        setSelectedPhotos((prev) => [...prev, photo]);
        toast.success(`Added ${photo.name} to prompt`);
      }
    }
  }, [photos, selectedPhotos]);

  // Click-to-add handler for menu photos
  const handlePhotoClick = useCallback((photo: MenuPhoto) => {
    if (!selectedPhotos.find((p) => p.id === photo.id)) {
      setSelectedPhotos((prev) => [...prev, photo]);
      toast.success(`Added ${photo.name} to prompt`);
    } else {
      toast.info(`${photo.name} is already in the prompt`);
    }
  }, [selectedPhotos]);

  const handleRemovePhoto = useCallback((id: string) => {
    setSelectedPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const addLoadingEntry = useCallback(() => {
    const id = `gen-${Date.now()}`;
    const newEntry: GenerationEntry = {
      id,
      images: [],
      timestamp: new Date(),
      isLoading: true,
    };
    setGenerationHistory((prev) => [newEntry, ...prev]);
    return id;
  }, []);

  const updateEntryWithImages = useCallback((id: string, images: string[]) => {
    setGenerationHistory((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? { ...entry, images, isLoading: false }
          : entry
      )
    );
  }, []);

  const removeLoadingEntry = useCallback((id: string) => {
    setGenerationHistory((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const handleGenerate = useCallback(async (prompt: string, ratio: string, resolution: string, photoAmount: string, styleGuideUrlParam?: string) => {
    const loadingId = addLoadingEntry();
    
    try {
      const imagePromises = selectedPhotos.map((p) => compressImageToBase64(p.src));
      const imageUrls = await Promise.all(imagePromises);
      const photoNames = selectedPhotos.map((p) => p.name);
      
      let styleGuideBase64: string | undefined;
      if (styleGuideUrlParam) {
        styleGuideBase64 = await compressImageToBase64(styleGuideUrlParam);
      }
      
      console.log('Sending', imageUrls.length, 'menu photos + style guide:', !!styleGuideBase64);
      
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt, ratio, resolution, photoAmount: parseInt(photoAmount), imageUrls, photoNames, styleGuideUrl: styleGuideBase64 }
      });

      if (error) {
        console.error('Generation error:', error);
        toast.error(error.message || 'Failed to generate content');
        removeLoadingEntry(loadingId);
        return;
      }

      if (data?.images && data.images.length > 0) {
        updateEntryWithImages(loadingId, data.images);
        toast.success("Content generated successfully!");
      } else {
        toast.error('No images were generated');
        removeLoadingEntry(loadingId);
      }
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Failed to generate content');
      removeLoadingEntry(loadingId);
    }
  }, [selectedPhotos, addLoadingEntry, updateEntryWithImages, removeLoadingEntry]);

  const handleRegenerate = useCallback(() => {
    handleGenerate("", selectedRatio, selectedResolution, selectedPhotoAmount, styleGuideUrl || undefined);
  }, [handleGenerate, selectedRatio, selectedResolution, selectedPhotoAmount, styleGuideUrl]);

  const handleGenerateRandom = useCallback(async () => {
    const count = Math.floor(Math.random() * 3) + 3;
    const shuffled = [...photos].sort(() => Math.random() - 0.5);
    const randomPhotos = shuffled.slice(0, count);
    
    const loadingId = addLoadingEntry();
    
    try {
      const imagePromises = randomPhotos.map((p) => compressImageToBase64(p.src));
      const imageUrls = await Promise.all(imagePromises);
      const photoNames = randomPhotos.map((p) => p.name);
      
      // Include style guide if available
      let styleGuideBase64: string | undefined;
      if (styleGuideUrl) {
        styleGuideBase64 = await compressImageToBase64(styleGuideUrl);
      }
      
      console.log('Random generation with', randomPhotos.length, 'photos:', photoNames, 'ratio:', selectedRatio, 'resolution:', selectedResolution, 'photoAmount:', selectedPhotoAmount, 'styleGuide:', !!styleGuideBase64);
      
      const randomPrompts = [
        "Create a mouthwatering promotional shot with dramatic lighting",
        "Design an appetizing hero image for social media",
        "Generate a premium restaurant advertisement",
        "Create an eye-catching menu showcase",
        "Design a delicious burger collage"
      ];
      const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
      
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt: randomPrompt, 
          ratio: selectedRatio, 
          resolution: selectedResolution, 
          photoAmount: parseInt(selectedPhotoAmount),
          imageUrls, 
          photoNames,
          styleGuideUrl: styleGuideBase64
        }
      });

      if (error) {
        console.error('Generation error:', error);
        toast.error(error.message || 'Failed to generate content');
        removeLoadingEntry(loadingId);
        return;
      }

      if (data?.images && data.images.length > 0) {
        updateEntryWithImages(loadingId, data.images);
        toast.success(`Random creation with ${randomPhotos.length} burgers!`);
      } else {
        toast.error('No images were generated');
        removeLoadingEntry(loadingId);
      }
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Failed to generate content');
      removeLoadingEntry(loadingId);
    }
  }, [photos, selectedRatio, selectedResolution, selectedPhotoAmount, styleGuideUrl, addLoadingEntry, updateEntryWithImages, removeLoadingEntry]);

  const handlePhotosAdded = useCallback((files: File[]) => {
    const newPhotos: MenuPhoto[] = files.map((file, index) => ({
      id: `uploaded-${Date.now()}-${index}`,
      name: file.name.replace(/\.[^/.]+$/, ""),
      src: URL.createObjectURL(file),
      category: "Uploaded",
    }));
    setPhotos((prev) => [...newPhotos, ...prev]);
    toast.success(`Added ${files.length} photo${files.length > 1 ? "s" : ""}`);
  }, []);

  const handleDeletePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setSelectedPhotos((prev) => prev.filter((p) => p.id !== id));
    toast.success("Photo deleted");
  }, []);

  const handleDeleteEntry = useCallback((entryId: string) => {
    setGenerationHistory((prev) => prev.filter((e) => e.id !== entryId));
    toast.success("Generation deleted");
  }, []);

  const handleDeleteImage = useCallback((entryId: string, imageIndex: number) => {
    setGenerationHistory((prev) =>
      prev.map((entry) => {
        if (entry.id === entryId) {
          const newImages = entry.images.filter((_, i) => i !== imageIndex);
          return { ...entry, images: newImages };
        }
        return entry;
      }).filter((entry) => entry.images.length > 0)
    );
    toast.success("Image deleted");
  }, []);

  const handleEditImage = useCallback((image: string) => {
    setLightboxImage(null);
    setEditingImage(image);
  }, []);

  const handleApplyEdit = useCallback(async (image: string, editPrompt: string) => {
    const loadingId = addLoadingEntry();
    
    try {
      const { data, error } = await supabase.functions.invoke('edit-image', {
        body: { imageUrl: image, editPrompt }
      });

      if (error) {
        console.error('Edit error:', error);
        toast.error(error.message || 'Failed to edit image');
        removeLoadingEntry(loadingId);
        return;
      }

      if (data?.image) {
        updateEntryWithImages(loadingId, [data.image]);
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
  }, [addLoadingEntry, updateEntryWithImages, removeLoadingEntry]);

  // Memoize drag overlay content to prevent re-renders
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

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="min-h-screen bg-background">
          <Header />
          
          <main className="container mx-auto px-4 py-8">
            <div className="mb-8 animate-fade-in">
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-2">
                Create <span className="gradient-text">Stunning</span> Content
              </h1>
              <p className="text-muted-foreground max-w-xl">
                Transform your menu photos into captivating marketing content. 
                Simply drag photos, describe your vision, and let AI do the magic.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <PhotoGallery 
                  photos={photos} 
                  onPhotosAdded={handlePhotosAdded} 
                  onDeletePhoto={handleDeletePhoto}
                  onPhotoClick={handlePhotoClick}
                />
              </div>

              <div className="lg:col-span-1 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <PromptBuilder
                  selectedPhotos={selectedPhotos}
                  onRemovePhoto={handleRemovePhoto}
                  onGenerate={handleGenerate}
                  selectedRatio={selectedRatio}
                  setSelectedRatio={setSelectedRatio}
                  selectedResolution={selectedResolution}
                  setSelectedResolution={setSelectedResolution}
                  selectedPhotoAmount={selectedPhotoAmount}
                  setSelectedPhotoAmount={setSelectedPhotoAmount}
                  styleGuideUrl={styleGuideUrl}
                  setStyleGuideUrl={setStyleGuideUrl}
                />
              </div>

              <div className="lg:col-span-1 animate-slide-up" style={{ animationDelay: "0.3s" }}>
                <GenerationHistory
                  history={generationHistory}
                  onImageClick={setLightboxImage}
                  onDeleteEntry={handleDeleteEntry}
                  onDeleteImage={handleDeleteImage}
                  onGenerateNew={handleGenerateRandom}
                  
                />
              </div>
            </div>
          </main>
        </div>

        <DragOverlay dropAnimation={null}>
          {dragOverlayContent}
        </DragOverlay>
      </DndContext>

      {lightboxImage && (
        <ImageLightbox 
          image={lightboxImage} 
          onClose={() => setLightboxImage(null)}
          onEdit={handleEditImage}
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
