import React from 'react';
import { Download, Trash2, Edit3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GenerationEntry {
  id: string;
  images: string[];
  timestamp: Date;
  isLoading?: boolean;
  prompt?: string;
  ratio?: string;
  resolution?: string;
}

interface MasonryGalleryProps {
  history: GenerationEntry[];
  onImageClick: (imageUrl: string, entryData?: { prompt?: string; ratio?: string; resolution?: string; timestamp?: Date; entryId?: string }) => void;
  onDelete: (id: string) => void;
  onEdit: (imageUrl: string) => void;
}

const LoadingCard: React.FC = () => {
  return (
    <div className="break-inside-avoid mb-4">
      <div className="relative bg-card/50 rounded-xl overflow-hidden border border-border/50 animate-pulse">
        <div className="aspect-square flex flex-col items-center justify-center gap-3 p-6">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <Loader2 className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-foreground/80">Generating...</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
      </div>
    </div>
  );
};

const ImageCard: React.FC<{
  imageUrl: string;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onDownload: () => void;
}> = ({ imageUrl, onClick, onDelete, onEdit, onDownload }) => {
  return (
    <div className="break-inside-avoid mb-4 group">
      <div className="relative bg-card rounded-xl overflow-hidden border border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <img
          src={imageUrl}
          alt="Generated content"
          className="w-full h-auto cursor-pointer"
          onClick={onClick}
          loading="lazy"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 bg-white/10 backdrop-blur-sm hover:bg-destructive/80 text-white"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const MasonryGallery: React.FC<MasonryGalleryProps> = ({
  history,
  onImageClick,
  onDelete,
  onEdit,
}) => {
  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `generated-${Date.now()}-${index}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `generated-${Date.now()}-${index}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  type LoadingItem = { type: 'loading'; id: string };
  type ImageItem = { type: 'image'; id: string; entryId: string; imageUrl: string; index: number; prompt?: string; ratio?: string; resolution?: string; timestamp: Date };
  type GalleryItem = LoadingItem | ImageItem;

  // Flatten all images from history entries
  const allItems: GalleryItem[] = [];
  for (const entry of history) {
    if (entry.isLoading) {
      allItems.push({ type: 'loading', id: entry.id });
    } else {
      for (let idx = 0; idx < entry.images.length; idx++) {
        allItems.push({
          type: 'image',
          id: `${entry.id}-${idx}`,
          entryId: entry.id,
          imageUrl: entry.images[idx],
          index: idx,
          prompt: entry.prompt,
          ratio: entry.ratio,
          resolution: entry.resolution,
          timestamp: entry.timestamp,
        });
      }
    }
  }

  if (allItems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
        <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <Edit3 className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-semibold text-foreground/80 mb-2">No generations yet</h3>
        <p className="text-muted-foreground max-w-md">
          Select photos from the menu, describe what you want to create, and hit generate to see your content here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 pb-32">
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
        {allItems.map((item) =>
          item.type === 'loading' ? (
            <LoadingCard key={item.id} />
          ) : (
            <ImageCard
              key={item.id}
              imageUrl={item.imageUrl}
              onClick={() => onImageClick(item.imageUrl, {
                prompt: item.prompt,
                ratio: item.ratio,
                resolution: item.resolution,
                timestamp: item.timestamp,
                entryId: item.entryId,
              })}
              onDelete={() => onDelete(item.entryId)}
              onEdit={() => onEdit(item.imageUrl)}
              onDownload={() => handleDownload(item.imageUrl, item.index)}
            />
          )
        )}
      </div>
    </div>
  );
};
