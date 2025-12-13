/**
 * IMPORTANT: DO NOT MODIFY THIS LAYOUT ALGORITHM
 * 
 * This implements a Highfield-style justified row gallery:
 * - 4 items per row, flowing left-to-right
 * - Each row scales to fill the full container width
 * - Items maintain their aspect ratios
 * - Row heights adjust based on the aspect ratios of items in that row
 * 
 * This layout has been carefully implemented and tested. Do not change
 * the row-based layout logic without explicit user approval.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Download, Trash2, Pencil, Loader2, MoreHorizontal, Heart, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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
  onRerun?: (entry: { prompt?: string; ratio?: string; resolution?: string }) => void;
  selectedImages?: string[];
  onToggleSelect?: (imageId: string) => void;
  onDeleteSelected?: () => void;
  onDownloadSelected?: () => void;
  onLoadImages?: (id: string) => void;
  onClearAll?: () => void;
}

const parseRatio = (ratio?: string): number => {
  if (!ratio) return 1;
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) return 1;
  return w / h;
};

type LoadingItem = { type: 'loading'; id: string; ratio?: string; aspectRatio: number };
type ImageItem = { type: 'image'; id: string; entryId: string; imageUrl: string; index: number; prompt?: string; ratio?: string; resolution?: string; timestamp: Date; aspectRatio: number };
type GalleryItem = LoadingItem | ImageItem;

// === LOCKED LAYOUT CONSTANTS - DO NOT MODIFY ===
const ITEMS_PER_ROW = 4;
const GAP = 8;
const MAX_ROW_HEIGHT = 280; // Only applied to partial rows (less than 4 items)

export const MasonryGallery: React.FC<MasonryGalleryProps> = ({
  history,
  onImageClick,
  onDelete,
  onEdit,
  onRerun,
  selectedImages = [],
  onToggleSelect,
  onDeleteSelected,
  onDownloadSelected,
  onLoadImages,
  onClearAll,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const loadingTriggered = useRef<Set<string>>(new Set());

  // Trigger lazy loading for entries that need images
  useEffect(() => {
    if (!onLoadImages) return;
    
    for (const entry of history) {
      // Entry has isLoading true, has a real DB id (not temp), and hasn't been triggered yet
      if (entry.isLoading && !entry.id.startsWith('gen-') && !loadingTriggered.current.has(entry.id)) {
        loadingTriggered.current.add(entry.id);
        onLoadImages(entry.id);
      }
    }
  }, [history, onLoadImages]);

  // Use ResizeObserver for reliable container width measurement
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      const width = container.offsetWidth;
      if (width > 0) {
        setContainerWidth(width);
      }
    };

    // Initial measurement with a small delay to ensure DOM is ready
    updateWidth();
    const timeoutId = setTimeout(updateWidth, 50);

    // Use ResizeObserver for more reliable updates
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setContainerWidth(width);
        }
      }
    });

    resizeObserver.observe(container);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
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

  // DEBUG: Log what MasonryGallery receives
  console.log('[MASONRY] Received history:', history.length, 'entries');
  console.log('[MASONRY] History details:', history.slice(0, 5).map(e => ({
    id: e.id,
    isLoading: e.isLoading,
    imagesCount: e.images?.length,
    firstImagePreview: e.images?.[0]?.substring(0, 50)
  })));

  const allItems: GalleryItem[] = [];
  for (const entry of history) {
    if (entry.isLoading) {
      allItems.push({ 
        type: 'loading', 
        id: entry.id, 
        ratio: entry.ratio,
        aspectRatio: parseRatio(entry.ratio),
      });
    } else if (entry.images && entry.images.length > 0) {
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
  
  console.log('[MASONRY] Built allItems:', allItems.length, 'items. Types:', allItems.slice(0, 5).map(i => i.type));

  const hasFailedEntries = history.length > 0 && allItems.length === 0;

  if (allItems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
        <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-6">
          <Pencil className="w-10 h-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-semibold text-foreground/80 mb-2">
          {hasFailedEntries ? 'Unable to load previous generations' : 'No generations yet'}
        </h3>
        <p className="text-muted-foreground max-w-md mb-4">
          {hasFailedEntries 
            ? 'The previous images are too large to load. Clear them to start fresh.'
            : 'Select photos from the menu, describe what you want to create, and hit generate to see your content here.'
          }
        </p>
        {hasFailedEntries && onClearAll && (
          <Button 
            variant="destructive" 
            onClick={onClearAll}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear Old Generations
          </Button>
        )}
      </div>
    );
  }

  // Group items into rows of 4
  const rows: GalleryItem[][] = [];
  for (let i = 0; i < allItems.length; i += ITEMS_PER_ROW) {
    rows.push(allItems.slice(i, i + ITEMS_PER_ROW));
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 pb-24 w-full" ref={containerRef}>
        {containerWidth <= 0 ? (
          <div className="h-32" /> /* Placeholder to allow measurement */
        ) : (
        <div className="flex flex-col w-full" style={{ gap: `${GAP}px` }}>
          {rows.map((row, rowIndex) => {
            // === JUSTIFIED ROW LAYOUT ===
            // Calculate gap space for THIS row (not assuming 4 items)
            const gapSpace = GAP * (row.length - 1);
            const rowAvailableWidth = containerWidth - gapSpace;
            const totalAspectRatio = row.reduce((sum, item) => sum + item.aspectRatio, 0);
            
            // Height that makes all items fit exactly in the row width
            const calculatedHeight = rowAvailableWidth / totalAspectRatio;
            
            // Partial rows: cap height so single images aren't huge
            const isPartialRow = row.length < ITEMS_PER_ROW;
            const rowHeight = isPartialRow 
              ? Math.min(MAX_ROW_HEIGHT, calculatedHeight)
              : calculatedHeight;

            return (
              <div 
                key={rowIndex} 
                className="flex w-full"
                style={{ gap: `${GAP}px`, height: `${rowHeight}px` }}
              >
                {row.map((item) => {
                  // Width = height * aspectRatio preserves exact aspect ratio
                  const itemWidth = rowHeight * item.aspectRatio;
                  const isSelected = item.type === 'image' && selectedImages.includes(item.id);

                  return item.type === 'loading' ? (
                    <div
                      key={item.id}
                      className="relative bg-muted/30 rounded-md overflow-hidden"
                      style={{ width: `${itemWidth}px`, height: '100%' }}
                    >
                      <LoadingCardContent ratio={item.ratio} />
                    </div>
                  ) : (
                    <div
                      key={item.id}
                      className={`relative group overflow-hidden cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'scale-[0.96] rounded-lg ring-4 ring-white' 
                          : 'rounded-md'
                      }`}
                      style={{ width: `${itemWidth}px`, height: '100%' }}
                      onClick={() => onImageClick(item.imageUrl, {
                        prompt: item.prompt,
                        ratio: item.ratio,
                        resolution: item.resolution,
                        timestamp: item.timestamp,
                        entryId: item.entryId,
                      })}
                    >
                      <img
                        src={item.imageUrl}
                        alt="Generated content"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Hover overlay - subtle gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                      
                      {/* Top left - Select checkbox - always visible if selected */}
                      <div className={`absolute top-3 left-3 transition-opacity duration-200 ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <div 
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${
                            isSelected 
                              ? 'border-primary bg-primary' 
                              : 'border-white/80 hover:border-white bg-transparent'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelect?.(item.id);
                          }}
                        >
                          {isSelected && (
                            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Top right controls - Edit, More */}
                      <div className="absolute top-3 right-3 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          className="flex items-center gap-1.5 text-white hover:text-white/80 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(item.imageUrl);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="text-sm font-medium">Edit</span>
                        </button>
                        <button
                          className="text-white hover:text-white/80 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRerun?.({ prompt: item.prompt, ratio: item.ratio, resolution: item.resolution });
                          }}
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Bottom right controls - Heart, Copy, Download, Delete */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          className="text-white hover:text-white/80 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.success('Added to favorites');
                          }}
                        >
                          <Heart className="w-5 h-5" />
                        </button>
                        <button
                          className="text-white hover:text-white/80 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(item.imageUrl);
                            toast.success('Image URL copied');
                          }}
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                        <button
                          className="text-white hover:text-white/80 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item.imageUrl, item.index);
                          }}
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button
                          className="text-white hover:text-white/80 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.entryId);
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Selection bar at bottom */}
      {selectedImages.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ml-[150px]">
          <div className="flex items-center gap-3 bg-card/95 backdrop-blur-xl border border-border/50 rounded-full px-5 py-3 shadow-2xl">
            <span className="text-sm font-medium text-foreground">
              {selectedImages.length} selected
            </span>
            <div className="w-px h-5 bg-border" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-4 gap-2 text-primary hover:text-primary hover:bg-primary/10 rounded-full"
              onClick={onDownloadSelected}
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-4 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
              onClick={onDeleteSelected}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

const LoadingCardContent: React.FC<{ ratio?: string }> = ({ ratio }) => {
  const [progress, setProgress] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const updateProgress = () => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      const newProgress = Math.min(95, 100 * (1 - Math.exp(-elapsed / 20)));
      setProgress(newProgress);
    };

    const interval = setInterval(updateProgress, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-2 bg-muted/80 backdrop-blur-sm rounded-full px-3 py-1.5 whitespace-nowrap">
          <Loader2 className="w-3.5 h-3.5 text-foreground/70 animate-spin flex-shrink-0" />
          <span className="text-xs font-medium text-foreground/70">Generating...</span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50">
        <div 
          className="h-full bg-primary/70 transition-all duration-200 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </>
  );
};