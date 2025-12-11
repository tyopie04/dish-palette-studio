import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { X, GripVertical, Maximize2 } from "lucide-react";

export interface MenuPhoto {
  id: string;
  name: string;
  src: string;
  category: string;
  thumbnailSrc?: string;
}

interface PhotoCardProps {
  photo: MenuPhoto;
  isDragging?: boolean;
  onDelete?: (id: string) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onEnlarge?: () => void;
  onReorderDragStart?: (e: React.DragEvent) => void;
  onReorderDragEnd?: () => void;
}

export const PhotoCard = memo(function PhotoCard({ 
  photo, 
  isDragging, 
  onDelete, 
  onClick, 
  onDoubleClick,
  onEnlarge,
  onReorderDragStart,
  onReorderDragEnd,
}: PhotoCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isCurrentlyDragging } = useDraggable({
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
    e.preventDefault();
    onDelete?.(photo.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if not currently dragging
    if (!isCurrentlyDragging && !transform && onClick) {
      onClick();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCurrentlyDragging && !transform && onDoubleClick) {
      onDoubleClick();
    }
  };

  return (
    <div 
      className="photo-card group aspect-square relative cursor-pointer" 
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      title="Click to add to prompt, double-click to enlarge"
    >
      {/* Reorder drag handle */}
      {onReorderDragStart && (
        <div
          draggable
          onDragStart={onReorderDragStart}
          onDragEnd={onReorderDragEnd}
          className="absolute top-2 left-2 z-20 p-1 rounded bg-background/90 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      
      {/* Draggable area for prompt builder */}
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
          src={photo.thumbnailSrc || photo.src}
          alt={photo.name}
          className="w-full h-full object-contain"
          draggable={false}
          loading="lazy"
        />
      </div>
      
      {/* Action buttons */}
      <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
        {onEnlarge && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEnlarge();
            }}
            className="p-1.5 rounded-full bg-background/90 text-muted-foreground hover:text-foreground hover:bg-background shadow-sm"
            title="Enlarge"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-full bg-background/90 text-muted-foreground hover:text-destructive hover:bg-background shadow-sm"
            title="Delete"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <p className="text-sm font-medium text-foreground truncate">{photo.name}</p>
        <p className="text-xs text-muted-foreground">{photo.category}</p>
      </div>
    </div>
  );
});
