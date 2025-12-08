import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface MenuPhoto {
  id: string;
  name: string;
  src: string;
  category: string;
}

interface PhotoCardProps {
  photo: MenuPhoto;
  isDragging?: boolean;
  onDelete?: (id: string) => void;
}

export const PhotoCard = memo(function PhotoCard({ photo, isDragging, onDelete }: PhotoCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: photo.id,
    data: photo,
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: 1000,
      }
    : undefined;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(photo.id);
  };

  return (
    <div className="photo-card group aspect-square relative">
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={cn(
          "w-full h-full cursor-grab active:cursor-grabbing touch-none",
          isDragging && "opacity-50"
        )}
      >
        <img
          src={photo.src}
          alt={photo.name}
          className="w-full h-full object-cover"
          draggable={false}
          loading="lazy"
        />
      </div>
      {onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background/90 text-muted-foreground hover:text-destructive hover:bg-background opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <p className="text-sm font-medium text-foreground truncate">{photo.name}</p>
        <p className="text-xs text-muted-foreground">{photo.category}</p>
      </div>
    </div>
  );
});
