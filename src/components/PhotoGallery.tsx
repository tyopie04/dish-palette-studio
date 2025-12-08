import { PhotoCard, MenuPhoto } from "./PhotoCard";
import { Plus, Upload } from "lucide-react";
import { Button } from "./ui/button";

interface PhotoGalleryProps {
  photos: MenuPhoto[];
  onUpload: () => void;
}

export function PhotoGallery({ photos, onUpload }: PhotoGalleryProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-semibold text-foreground">Menu Photos</h2>
          <p className="text-sm text-muted-foreground">Drag photos to the prompt area</p>
        </div>
        <Button variant="glass" size="sm" onClick={onUpload}>
          <Upload className="w-4 h-4" />
          Upload
        </Button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {photos.map((photo) => (
          <PhotoCard key={photo.id} photo={photo} />
        ))}
        
        <button
          onClick={onUpload}
          className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors duration-300 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
        >
          <Plus className="w-8 h-8" />
          <span className="text-xs">Add Photo</span>
        </button>
      </div>
    </div>
  );
}
