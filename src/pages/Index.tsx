import { useState, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Header } from "@/components/Header";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PromptBuilder } from "@/components/PromptBuilder";
import { GeneratedContent } from "@/components/GeneratedContent";
import { PhotoCard, MenuPhoto } from "@/components/PhotoCard";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import menu1 from "@/assets/menu-1.jpg";
import menu2 from "@/assets/menu-2.jpg";
import menu3 from "@/assets/menu-3.jpg";
import menu4 from "@/assets/menu-4.jpg";
import menu5 from "@/assets/menu-5.jpg";
import menu6 from "@/assets/menu-6.jpg";

const initialPhotos: MenuPhoto[] = [
  { id: "1", name: "Truffle Pasta", src: menu1, category: "Pasta" },
  { id: "2", name: "Ribeye Steak", src: menu2, category: "Mains" },
  { id: "3", name: "Chocolate Lava", src: menu3, category: "Desserts" },
  { id: "4", name: "Sushi Platter", src: menu4, category: "Japanese" },
  { id: "5", name: "Gourmet Burger", src: menu5, category: "Burgers" },
  { id: "6", name: "Greek Salad", src: menu6, category: "Salads" },
];

// Compress and convert image to base64 (max 512px, JPEG quality 0.7)
const compressImageToBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 512;
      let width = img.width;
      let height = img.height;
      
      // Scale down if larger than maxSize
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
      
      // Convert to JPEG with 0.7 quality for smaller file size
      const base64 = canvas.toDataURL("image/jpeg", 0.7);
      resolve(base64);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
};

const Index = () => {
  const [photos, setPhotos] = useState<MenuPhoto[]>(initialPhotos);
  const [selectedPhotos, setSelectedPhotos] = useState<MenuPhoto[]>([]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePhoto, setActivePhoto] = useState<MenuPhoto | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const photo = photos.find((p) => p.id === event.active.id);
    if (photo) {
      setActivePhoto(photo);
    }
  }, [photos]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActivePhoto(null);
    
    if (event.over?.id === "prompt-builder") {
      const photo = photos.find((p) => p.id === event.active.id);
      if (photo && !selectedPhotos.find((p) => p.id === photo.id)) {
        setSelectedPhotos((prev) => [...prev, photo]);
        toast.success(`Added ${photo.name} to prompt`);
      }
    }
  }, [photos, selectedPhotos]);

  const handleRemovePhoto = useCallback((id: string) => {
    setSelectedPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleGenerate = useCallback(async (prompt: string, style: string) => {
    setIsGenerating(true);
    
    try {
      // Compress images and convert to base64 (limit to 2 images to avoid payload issues)
      const photosToProcess = selectedPhotos.slice(0, 2);
      const imagePromises = photosToProcess.map((p) => compressImageToBase64(p.src));
      const imageUrls = await Promise.all(imagePromises);
      const photoNames = selectedPhotos.map((p) => p.name);
      
      console.log('Sending', imageUrls.length, 'compressed images');
      
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt, style, imageUrls, photoNames }
      });

      if (error) {
        console.error('Generation error:', error);
        toast.error(error.message || 'Failed to generate content');
        setIsGenerating(false);
        return;
      }

      if (data?.images && data.images.length > 0) {
        setGeneratedImages(data.images);
        toast.success("Content generated successfully!");
      } else {
        toast.error('No images were generated');
      }
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Failed to generate content');
    }
    
    setIsGenerating(false);
  }, [selectedPhotos]);

  const handleRegenerate = useCallback(() => {
    handleGenerate("", "social");
  }, [handleGenerate]);

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

  return (
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
            {/* Photo Gallery */}
            <div className="lg:col-span-1 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <PhotoGallery photos={photos} onPhotosAdded={handlePhotosAdded} onDeletePhoto={handleDeletePhoto} />
            </div>

            {/* Prompt Builder */}
            <div className="lg:col-span-1 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <PromptBuilder
                selectedPhotos={selectedPhotos}
                onRemovePhoto={handleRemovePhoto}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </div>

            {/* Generated Content */}
            <div className="lg:col-span-1 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <GeneratedContent
                images={generatedImages}
                onRegenerate={handleRegenerate}
              />
            </div>
          </div>
        </main>
      </div>

      <DragOverlay>
        {activePhoto ? (
          <div className="w-24 h-24 rounded-lg overflow-hidden shadow-2xl opacity-80">
            <img
              src={activePhoto.src}
              alt={activePhoto.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Index;
