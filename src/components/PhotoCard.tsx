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

export function PhotoCard({ photo, isDragging, onDelete }: PhotoCardProps) {
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
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "photo-card group aspect-square",
        isDragging && "opacity-50"
      )}
    >
      <img
        src={photo.src}
        alt={photo.name}
        className="w-full h-full object-cover"
        draggable={false}
      />
      {onDelete && (
        <button
          onClick={handleDelete}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-muted-foreground hover:text-destructive hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-sm font-medium text-foreground truncate">{photo.name}</p>
        <p className="text-xs text-muted-foreground">{photo.category}</p>
      </div>
    </div>
  );
}
