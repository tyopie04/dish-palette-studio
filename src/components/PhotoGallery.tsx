import { useRef, useState } from "react";
import { PhotoCard, MenuPhoto } from "./PhotoCard";
import { Plus, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { MenuPhotoLightbox } from "./MenuPhotoLightbox";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";

interface PhotoGalleryProps {
  photos: MenuPhoto[];
  onPhotosAdded: (files: File[]) => void;
  onDeletePhoto: (id: string) => void;
  onPhotoClick?: (photo: MenuPhoto) => void;
  onReorder?: (photos: MenuPhoto[]) => void;
}

function SortablePhotoCard({
  photo,
  onDelete,
  onClick,
  onDoubleClick,
}: {
  photo: MenuPhoto;
  onDelete: (id: string) => void;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PhotoCard
        photo={photo}
        onDelete={onDelete}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      />
    </div>
  );
}

export function PhotoGallery({
  photos,
  onPhotosAdded,
  onDeletePhoto,
  onPhotoClick,
  onReorder,
}: PhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = photos.findIndex((p) => p.id === active.id);
      const newIndex = photos.findIndex((p) => p.id === over.id);
      const newPhotos = arrayMove(photos, oldIndex, newIndex);
      onReorder?.(newPhotos);
    }
  };

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
              Click to add, double-click to enlarge, or drag to reorder
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={openFilePicker}>
            <Upload className="w-4 h-4" />
            Upload
          </Button>
        </div>

        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <SortablePhotoCard
                  key={photo.id}
                  photo={photo}
                  onDelete={onDeletePhoto}
                  onClick={() => handlePhotoCardClick(photo)}
                  onDoubleClick={() => handlePhotoDoubleClick(index)}
                />
              ))}

              <button
                onClick={openFilePicker}
                className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-foreground/50 transition-colors duration-200 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-8 h-8" />
                <span className="text-xs">Add Photo</span>
              </button>
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {lightboxIndex !== null && (
        <MenuPhotoLightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
