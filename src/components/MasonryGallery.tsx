import React, { useState, useEffect, useRef } from 'react';
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

// Parse ratio string to get aspect ratio number
const parseRatio = (ratio?: string): number => {
  if (!ratio) return 1;
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) return 1;
  return w / h;
};

const LoadingCard: React.FC<{ ratio?: string; aspectRatio: number; height: number }> = ({ ratio, aspectRatio, height }) => {
  const [progress, setProgress] = useState(0);
  const startTime = useRef(Date.now());

  // More realistic progress simulation that slows down over time
  useEffect(() => {
    const updateProgress = () => {
      const elapsed = (Date.now() - startTime.current) / 1000; // seconds
      // Logarithmic curve that starts fast and slows down
      // Reaches ~60% at 10s, ~80% at 30s, ~90% at 60s
      const newProgress = Math.min(95, 100 * (1 - Math.exp(-elapsed / 20)));
      setProgress(newProgress);
    };

    const interval = setInterval(updateProgress, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="relative bg-muted/30 rounded-md overflow-hidden flex-shrink-0"
      style={{ 
        width: height * aspectRatio,
        height: height,
      }}
    >
      {/* Generating badge in top left */}
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-2 bg-muted/80 backdrop-blur-sm rounded-full px-3 py-1.5">
          <Loader2 className="w-3.5 h-3.5 text-foreground/70 animate-spin" />
          <span className="text-xs font-medium text-foreground/70">Generating...</span>
        </div>
      </div>

      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
        <div 
          className="h-full bg-primary/70 transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

const ImageCard: React.FC<{
  imageUrl: string;
  aspectRatio: number;
  height: number;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onDownload: () => void;
}> = ({ imageUrl, aspectRatio, height, onClick, onDelete, onEdit, onDownload }) => {
  return (
    <div 
      className="relative group overflow-hidden rounded-md cursor-pointer flex-shrink-0"
      style={{ 
        width: height * aspectRatio,
        height: height,
      }}
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Track container width for responsive layout
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 16); // Account for padding
      }
    };
    
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);

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

  type LoadingItem = { type: 'loading'; id: string; ratio?: string; aspectRatio: number };
  type ImageItem = { type: 'image'; id: string; entryId: string; imageUrl: string; index: number; prompt?: string; ratio?: string; resolution?: string; timestamp: Date; aspectRatio: number };
  type GalleryItem = LoadingItem | ImageItem;

  // Flatten all images from history entries
  const allItems: GalleryItem[] = [];
  for (const entry of history) {
    if (entry.isLoading) {
      allItems.push({ 
        type: 'loading', 
        id: entry.id, 
        ratio: entry.ratio,
        aspectRatio: parseRatio(entry.ratio),
      });
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
          aspectRatio: parseRatio(entry.ratio),
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

  // Build rows with justified layout - each row has its own calculated height
  const gap = 4;
  const itemsPerRow = 4;
  const targetRowHeight = 280; // Base target height
  
  type JustifiedRow = { items: GalleryItem[]; height: number };
  const rows: JustifiedRow[] = [];
  
  for (let i = 0; i < allItems.length; i += itemsPerRow) {
    const rowItems = allItems.slice(i, i + itemsPerRow);
    
    // Calculate total aspect ratio for this row
    const totalAspectRatio = rowItems.reduce((sum, item) => sum + item.aspectRatio, 0);
    
    // Calculate row height to fit all images in available width
    // Formula: containerWidth = height * (sum of aspect ratios) + gaps
    const totalGapWidth = (rowItems.length - 1) * gap;
    const availableWidth = containerWidth - totalGapWidth;
    
    // Calculate height that makes images fit the row width
    let rowHeight = availableWidth / totalAspectRatio;
    
    // Clamp height to reasonable bounds
    const minHeight = 150;
    const maxHeight = 400;
    rowHeight = Math.max(minHeight, Math.min(maxHeight, rowHeight));
    
    rows.push({ items: rowItems, height: rowHeight });
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-2 pb-32">
      <div className="flex flex-col gap-1">
        {rows.map((row, rowIndex) => (
          <div 
            key={rowIndex} 
            className="flex gap-1"
          >
            {row.items.map((item) =>
              item.type === 'loading' ? (
                <LoadingCard 
                  key={item.id} 
                  ratio={item.ratio} 
                  aspectRatio={item.aspectRatio}
                  height={row.height}
                />
              ) : (
                <ImageCard
                  key={item.id}
                  imageUrl={item.imageUrl}
                  aspectRatio={item.aspectRatio}
                  height={row.height}
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
