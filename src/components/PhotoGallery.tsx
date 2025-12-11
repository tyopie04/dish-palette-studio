import { useRef, useState, useCallback } from "react";
import { PhotoCard } from "./PhotoCard";
import { Plus, Upload, Grid2X2, Grid3X3, LayoutGrid } from "lucide-react";
import { Button } from "./ui/button";
import { MenuPhotoLightbox } from "./MenuPhotoLightbox";
import { RenamePhotoDialog } from "./RenamePhotoDialog";
import { MenuPhoto } from "@/hooks/useMenuPhotos";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";

type PhotoSize = "small" | "medium" | "large";

interface PhotoGalleryProps {
  photos: MenuPhoto[];
  onPhotosAdded: (files: File[]) => void;
  onDeletePhoto: (id: string) => void;
  onPhotoClick?: (photo: MenuPhoto) => void;
  onReorder?: (photos: MenuPhoto[]) => void;
  onRenamePhoto?: (id: string, newName: string) => void;
  loading?: boolean;
  photoSize?: PhotoSize;
  onPhotoSizeChange?: (size: PhotoSize) => void;
}

const sizeConfig = {
  small: { cols: "grid-cols-4", icon: LayoutGrid },
  medium: { cols: "grid-cols-3", icon: Grid3X3 },
  large: { cols: "grid-cols-2", icon: Grid2X2 },
};

export function PhotoGallery({
  photos,
  onPhotosAdded,
  onDeletePhoto,
  onPhotoClick,
  onReorder,
  onRenamePhoto,
  loading,
  photoSize = "medium",
  onPhotoSizeChange,
}: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [reorderDragIndex, setReorderDragIndex] = useState<number | null>(null);
  const [renamePhoto, setRenamePhoto] = useState<MenuPhoto | null>(null);
  const [sizeOpen, setSizeOpen] = useState(false);

  const gridCols = sizeConfig[photoSize].cols;

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

        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-display font-semibold text-foreground">
              Menu Photos
            </h2>
            <p className="text-xs text-muted-foreground truncate">
              Click to add, double-click to enlarge
            </p>
          </div>
          <div className="flex items-center gap-1">
            {onPhotoSizeChange && (
              <Popover open={sizeOpen} onOpenChange={setSizeOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {photoSize === "small" && <LayoutGrid className="w-4 h-4" />}
                    {photoSize === "medium" && <Grid3X3 className="w-4 h-4" />}
                    {photoSize === "large" && <Grid2X2 className="w-4 h-4" />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1" align="end">
                  <div className="space-y-1">
                    {(["small", "medium", "large"] as PhotoSize[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => { onPhotoSizeChange(size); setSizeOpen(false); }}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent transition-colors capitalize",
                          photoSize === size && "bg-accent text-accent-foreground"
                        )}
                      >
                        {size === "small" && <LayoutGrid className="w-4 h-4" />}
                        {size === "medium" && <Grid3X3 className="w-4 h-4" />}
                        {size === "large" && <Grid2X2 className="w-4 h-4" />}
                        {size}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={openFilePicker}>
              <Upload className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className={cn("grid gap-2", gridCols)}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className={cn("grid gap-2", gridCols)}>
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
                  onRename={() => setRenamePhoto(photo)}
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

      {renamePhoto && onRenamePhoto && (
        <RenamePhotoDialog
          open={!!renamePhoto}
          onOpenChange={(open) => !open && setRenamePhoto(null)}
          currentName={renamePhoto.name}
          onRename={(newName) => onRenamePhoto(renamePhoto.id, newName)}
        />
      )}
    </>
  );
}
