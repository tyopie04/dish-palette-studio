import { useState, useCallback, useEffect } from "react";
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

export function useMenuPhotos() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<MenuPhoto[]>([]);
  const [loading, setLoading] = useState(true);

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

      const mappedPhotos: MenuPhoto[] = (data || []).map((photo) => ({
        id: photo.id,
        name: photo.name,
        src: photo.original_url,
        thumbnailSrc: photo.thumbnail_url,
        category: photo.category,
      }));

      setPhotos(mappedPhotos);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const uploadPhotos = useCallback(
    async (files: File[]) => {
      if (!user) {
        toast.error("Please sign in to upload photos");
        return;
      }

      const uploadPromises = files.map(async (file, index) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}-${index}.${fileExt}`;
        const thumbnailName = `${user.id}/${Date.now()}-${index}-thumb.${fileExt}`;

        // Upload original
        const { error: uploadError } = await supabase.storage
          .from("menu-photos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Create thumbnail
        const thumbnail = await createThumbnail(file);
        const { error: thumbError } = await supabase.storage
          .from("menu-photos")
          .upload(thumbnailName, thumbnail);

        if (thumbError) throw thumbError;

        const { data: urlData } = supabase.storage
          .from("menu-photos")
          .getPublicUrl(fileName);

        const { data: thumbUrlData } = supabase.storage
          .from("menu-photos")
          .getPublicUrl(thumbnailName);

        // Get current max order
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
            name: file.name.replace(/\.[^/.]+$/, ""),
            original_url: urlData.publicUrl,
            thumbnail_url: thumbUrlData.publicUrl,
            display_order: maxOrder + 1 + index,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        return {
          id: insertedPhoto.id,
          name: insertedPhoto.name,
          src: insertedPhoto.original_url,
          thumbnailSrc: insertedPhoto.thumbnail_url,
          category: insertedPhoto.category,
        } as MenuPhoto;
      });

      try {
        const newPhotos = await Promise.all(uploadPromises);
        setPhotos((prev) => [...newPhotos, ...prev]);
        toast.success(`Uploaded ${files.length} photo${files.length > 1 ? "s" : ""}`);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload some photos");
      }
    },
    [user]
  );

  const deletePhoto = useCallback(
    async (id: string) => {
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
        console.error("Delete error:", error);
        toast.error("Failed to delete photo");
      }
    },
    [user]
  );

  const reorderPhotos = useCallback(
    async (newPhotos: MenuPhoto[]) => {
      if (!user) return;

      setPhotos(newPhotos);

      try {
        const updates = newPhotos.map((photo, index) => ({
          id: photo.id,
          user_id: user.id,
          name: photo.name,
          original_url: photo.src,
          thumbnail_url: photo.thumbnailSrc,
          category: photo.category,
          display_order: index,
        }));

        const { error } = await supabase.from("menu_photos").upsert(updates);

        if (error) throw error;
      } catch (error) {
        console.error("Reorder error:", error);
        fetchPhotos();
      }
    },
    [user, fetchPhotos]
  );

  const renamePhoto = useCallback(
    async (id: string, newName: string) => {
      if (!user) return;

      try {
        const { error } = await supabase
          .from("menu_photos")
          .update({ name: newName })
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;

        setPhotos((prev) =>
          prev.map((p) => (p.id === id ? { ...p, name: newName } : p))
        );
        toast.success("Photo renamed");
      } catch (error) {
        console.error("Rename error:", error);
        toast.error("Failed to rename photo");
      }
    },
    [user]
  );

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

async function createThumbnail(file: File, maxSize = 400): Promise<Blob> {
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
          else reject(new Error("Failed to create blob"));
        },
        "image/jpeg",
        0.8
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}
