import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { MenuPhoto } from "./PhotoCard";
import { useEffect, useCallback } from "react";

interface MenuPhotoLightboxProps {
  photos: MenuPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function MenuPhotoLightbox({ photos, currentIndex, onClose, onNavigate }: MenuPhotoLightboxProps) {
  const currentPhoto = photos[currentIndex];

  const handlePrevious = useCallback(() => {
    onNavigate(currentIndex > 0 ? currentIndex - 1 : photos.length - 1);
  }, [currentIndex, photos.length, onNavigate]);

  const handleNext = useCallback(() => {
    onNavigate(currentIndex < photos.length - 1 ? currentIndex + 1 : 0);
  }, [currentIndex, photos.length, onNavigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, handlePrevious, handleNext]);

  if (!currentPhoto) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-10 text-foreground hover:bg-secondary"
        onClick={onClose}
      >
        <X className="w-6 h-6" />
      </Button>

      {/* Navigation arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-foreground hover:bg-secondary h-12 w-12"
        onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
      >
        <ChevronLeft className="w-8 h-8" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-foreground hover:bg-secondary h-12 w-12"
        onClick={(e) => { e.stopPropagation(); handleNext(); }}
      >
        <ChevronRight className="w-8 h-8" />
      </Button>

      {/* Image container */}
      <div 
        className="relative max-w-[90vw] max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentPhoto.src}
          alt={currentPhoto.name}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
        
        {/* Photo info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4 rounded-b-lg">
          <p className="text-foreground font-medium">{currentPhoto.name}</p>
          <p className="text-sm text-muted-foreground">
            {currentIndex + 1} of {photos.length}
          </p>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto py-2 px-4">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={(e) => { e.stopPropagation(); onNavigate(index); }}
            className={`w-12 h-12 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all ${
              index === currentIndex 
                ? "border-primary ring-2 ring-primary/50" 
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <img
              src={photo.src}
              alt={photo.name}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
