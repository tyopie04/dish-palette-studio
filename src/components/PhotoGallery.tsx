import { useRef, useState, useCallback } from "react";
import { PhotoCard } from "./PhotoCard";
import { Plus, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { MenuPhotoLightbox } from "./MenuPhotoLightbox";
import { MenuPhoto } from "@/hooks/useMenuPhotos";

interface PhotoGalleryProps {
  photos: MenuPhoto[];
  onPhotosAdded: (files: File[]) => void;
  onDeletePhoto: (id: string) => void;
  onPhotoClick?: (photo: MenuPhoto) => void;
  onReorder?: (photos: MenuPhoto[]) => void;
  loading?: boolean;
}

export function PhotoGallery({
  photos,
  onPhotosAdded,
  onDeletePhoto,
  onPhotoClick,
  onReorder,
  loading,
}: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [reorderDragIndex, setReorderDragIndex] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onPhotosAdded(files);
    }
    e.target.value = "";
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoCardClick = (photo: MenuPhoto) => {
    if (onPhotoClick) {
      onPhotoClick(photo);
    }
  };

  const handlePhotoDoubleClick = (index: number) => {
    setLightboxIndex(index);
  };

  // Instant reorder via drag handle - using native drag events
  const handleReorderDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
    setReorderDragIndex(index);
  }, []);

  const handleReorderDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (reorderDragIndex !== null && reorderDragIndex !== index) {
      setDragOverIndex(index);
      
      // INSTANT reorder - no delay
      if (onReorder) {
        const newPhotos = [...photos];
        const [removed] = newPhotos.splice(reorderDragIndex, 1);
        newPhotos.splice(index, 0, removed);
        onReorder(newPhotos);
        setReorderDragIndex(index);
      }
      setDragOverIndex(null);
    }
  }, [reorderDragIndex, photos, onReorder]);

  const handleReorderDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleReorderDragEnd = useCallback(() => {
    setReorderDragIndex(null);
    setDragOverIndex(null);
  }, []);

  // Convert to lightbox-compatible format with full-quality src
  const lightboxPhotos = photos.map((p) => ({
    id: p.id,
    name: p.name,
    src: p.src, // Full quality original
    category: p.category,
  }));

  return (
    <>
      <div className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-semibold text-foreground">
              Menu Photos
            </h2>
            <p className="text-sm text-muted-foreground">
              Click to add, double-click to enlarge, drag handle to reorder
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={openFilePicker}>
            <Upload className="w-4 h-4" />
            Upload
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={`relative transition-all duration-200 ${
                  dragOverIndex === index ? "ring-2 ring-primary scale-105" : ""
                } ${reorderDragIndex === index ? "opacity-50" : ""}`}
                onDragOver={(e) => handleReorderDragOver(e, index)}
                onDragLeave={handleReorderDragLeave}
              >
                <PhotoCard
                  photo={{
                    id: photo.id,
                    name: photo.name,
                    src: photo.thumbnailSrc || photo.src, // Use thumbnail for display
                    category: photo.category,
                  }}
                  onDelete={onDeletePhoto}
                  onClick={() => handlePhotoCardClick(photo)}
                  onDoubleClick={() => handlePhotoDoubleClick(index)}
                  onEnlarge={() => handlePhotoDoubleClick(index)}
                  onReorderDragStart={(e) => handleReorderDragStart(e, index)}
                  onReorderDragEnd={handleReorderDragEnd}
                />
              </div>
            ))}

            <button
              onClick={openFilePicker}
              className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-foreground/50 transition-colors duration-200 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-8 h-8" />
              <span className="text-xs">Add Photo</span>
            </button>
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <MenuPhotoLightbox
          photos={lightboxPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
