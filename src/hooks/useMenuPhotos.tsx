import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface MenuPhoto {
  id: string;
  name: string;
  src: string;
  thumbnailSrc: string;
  category: string;
}

// Generate thumbnail from image file
async function generateThumbnail(file: File, maxSize: number = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
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
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function useMenuPhotos() {
  const [photos, setPhotos] = useState<MenuPhoto[]>([]);
  const [loading] = useState(false);

  // No-op fetch
  const fetchPhotos = useCallback(async () => {
    // Local only
  }, []);

  // Upload new photos (local only - creates data URLs)
  const uploadPhotos = useCallback(async (files: File[]) => {
    const uploadPromises = files.map(async (file, index) => {
      const id = `photo-${Date.now()}-${index}`;
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      
      // Create data URL for the original
      const originalUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      // Generate thumbnail
      const thumbnailUrl = await generateThumbnail(file);

      return {
        id,
        name: fileName,
        src: originalUrl,
        thumbnailSrc: thumbnailUrl,
        category: "Uploaded",
      } as MenuPhoto;
    });

    try {
      const newPhotos = await Promise.all(uploadPromises);
      setPhotos((prev) => [...newPhotos, ...prev]);
      toast.success(`Uploaded ${files.length} photo${files.length > 1 ? "s" : ""}`);
    } catch (error) {
      toast.error("Failed to upload some photos");
    }
  }, []);

  // Delete photo
  const deletePhoto = useCallback(async (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    toast.success("Photo deleted");
  }, []);

  // Reorder photos
  const reorderPhotos = useCallback(async (newPhotos: MenuPhoto[]) => {
    setPhotos(newPhotos);
  }, []);

  // Rename photo
  const renamePhoto = useCallback(async (id: string, newName: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
    );
    toast.success("Photo renamed");
  }, []);

  return {
    photos,
    loading,
    uploadPhotos,
    deletePhoto,
    reorderPhotos,
    renamePhoto,
    refetch: fetchPhotos,
  };
}
