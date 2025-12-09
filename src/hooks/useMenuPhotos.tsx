import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface MenuPhoto {
  id: string;
  name: string;
  src: string;
  thumbnailSrc: string;
  category: string;
}

interface DbMenuPhoto {
  id: string;
  user_id: string;
  name: string;
  category: string;
  original_url: string;
  thumbnail_url: string;
  display_order: number;
  created_at: string;
}

// Generate thumbnail from image file
async function generateThumbnail(file: File, maxSize: number = 400): Promise<Blob> {
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
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create thumbnail"));
        },
        "image/jpeg",
        0.8
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export function useMenuPhotos() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<MenuPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch photos from database
  const fetchPhotos = useCallback(async () => {
    if (!user) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("menu_photos")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true });

      if (error) throw error;

      const mappedPhotos: MenuPhoto[] = (data as DbMenuPhoto[]).map((photo) => ({
        id: photo.id,
        name: photo.name,
        src: photo.original_url,
        thumbnailSrc: photo.thumbnail_url,
        category: photo.category,
      }));

      setPhotos(mappedPhotos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      toast.error("Failed to load photos");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Upload new photos
  const uploadPhotos = useCallback(async (files: File[]) => {
    if (!user) return;

    const uploadPromises = files.map(async (file, index) => {
      const timestamp = Date.now();
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      const fileExt = file.name.split(".").pop();
      const originalPath = `${user.id}/original-${timestamp}-${index}.${fileExt}`;
      const thumbnailPath = `${user.id}/thumb-${timestamp}-${index}.jpg`;

      try {
        // Generate thumbnail
        const thumbnailBlob = await generateThumbnail(file);

        // Upload original
        const { error: originalError } = await supabase.storage
          .from("menu-photos")
          .upload(originalPath, file);

        if (originalError) throw originalError;

        // Upload thumbnail
        const { error: thumbError } = await supabase.storage
          .from("menu-photos")
          .upload(thumbnailPath, thumbnailBlob);

        if (thumbError) throw thumbError;

        // Get public URLs
        const { data: originalUrlData } = supabase.storage
          .from("menu-photos")
          .getPublicUrl(originalPath);

        const { data: thumbUrlData } = supabase.storage
          .from("menu-photos")
          .getPublicUrl(thumbnailPath);

        // Get current max display_order
        const { data: maxOrderData } = await supabase
          .from("menu_photos")
          .select("display_order")
          .eq("user_id", user.id)
          .order("display_order", { ascending: false })
          .limit(1);

        const maxOrder = maxOrderData?.[0]?.display_order ?? -1;

        // Insert into database
        const { data: insertedPhoto, error: insertError } = await supabase
          .from("menu_photos")
          .insert({
            user_id: user.id,
            name: fileName,
            category: "Uploaded",
            original_url: originalUrlData.publicUrl,
            thumbnail_url: thumbUrlData.publicUrl,
            display_order: maxOrder + 1 + index,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return {
          id: insertedPhoto.id,
          name: fileName,
          src: originalUrlData.publicUrl,
          thumbnailSrc: thumbUrlData.publicUrl,
          category: "Uploaded",
        } as MenuPhoto;
      } catch (error) {
        console.error("Error uploading photo:", error);
        throw error;
      }
    });

    try {
      const newPhotos = await Promise.all(uploadPromises);
      setPhotos((prev) => [...newPhotos, ...prev]);
      toast.success(`Uploaded ${files.length} photo${files.length > 1 ? "s" : ""}`);
    } catch (error) {
      toast.error("Failed to upload some photos");
    }
  }, [user]);

  // Delete photo
  const deletePhoto = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("menu_photos")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setPhotos((prev) => prev.filter((p) => p.id !== id));
      toast.success("Photo deleted");
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Failed to delete photo");
    }
  }, [user]);

  // Reorder photos
  const reorderPhotos = useCallback(async (newPhotos: MenuPhoto[]) => {
    if (!user) return;

    setPhotos(newPhotos);

    try {
      const updates = newPhotos.map((photo, index) => ({
        id: photo.id,
        user_id: user.id,
        name: photo.name,
        category: photo.category,
        original_url: photo.src,
        thumbnail_url: photo.thumbnailSrc,
        display_order: index,
      }));

      const { error } = await supabase
        .from("menu_photos")
        .upsert(updates, { onConflict: "id" });

      if (error) throw error;
    } catch (error) {
      console.error("Error reordering photos:", error);
      toast.error("Failed to save photo order");
      fetchPhotos(); // Revert to server state
    }
  }, [user, fetchPhotos]);

  return {
    photos,
    loading,
    uploadPhotos,
    deletePhoto,
    reorderPhotos,
    refetch: fetchPhotos,
  };
}
