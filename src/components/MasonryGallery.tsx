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
    <div className="relative bg-card/50 rounded-md overflow-hidden border border-border/30 aspect-square flex items-center justify-center min-w-[200px]">
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <Loader2 className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="text-xs font-medium text-foreground/70">Generating...</p>
      </div>
    </div>
  );
};

const ImageCard: React.FC<{
  imageUrl: string;
  ratio?: string;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onDownload: () => void;
}> = ({ imageUrl, ratio, onClick, onDelete, onEdit, onDownload }) => {
  // Calculate flex-grow based on aspect ratio
  const getFlexGrow = () => {
    if (!ratio) return 1;
    const [w, h] = ratio.split(':').map(Number);
    return w / h;
  };

  return (
    <div 
      className="relative group overflow-hidden rounded-md cursor-pointer"
      style={{ flexGrow: getFlexGrow(), flexBasis: 0 }}
      onClick={onClick}
    >
      <img
        src={imageUrl}
        alt="Generated content"
        className="w-full h-full object-cover"
        loading="lazy"
      />
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-end gap-1.5 pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-white/10 backdrop-blur-sm hover:bg-destructive/80 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
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

  // Group items into rows (4 items per row for optimal display)
  const itemsPerRow = 4;
  const rows: GalleryItem[][] = [];
  for (let i = 0; i < allItems.length; i += itemsPerRow) {
    rows.push(allItems.slice(i, i + itemsPerRow));
  }

  return (
    <div className="flex-1 overflow-y-auto p-1 pb-32">
      <div className="flex flex-col gap-1">
        {rows.map((row, rowIndex) => (
          <div 
            key={rowIndex} 
            className="flex gap-1"
            style={{ height: '280px' }}
          >
            {row.map((item) =>
              item.type === 'loading' ? (
                <LoadingCard key={item.id} />
              ) : (
                <ImageCard
                  key={item.id}
                  imageUrl={item.imageUrl}
                  ratio={item.ratio}
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
        ))}
      </div>
    </div>
  );
};