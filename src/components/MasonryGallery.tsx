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
import { Download, Trash2, Edit3, Loader2, MoreHorizontal, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const ITEMS_PER_ROW = 4;
const GAP = 4;

export const MasonryGallery: React.FC<MasonryGalleryProps> = ({
  history,
  onImageClick,
  onDelete,
  onEdit,
  onRerun,
  selectedImages = [],
  onToggleSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
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

  // Group items into rows of 4
  const rows: GalleryItem[][] = [];
  for (let i = 0; i < allItems.length; i += ITEMS_PER_ROW) {
    rows.push(allItems.slice(i, i + ITEMS_PER_ROW));
  }

  // Calculate row heights to make each row fill the container width
  const availableWidth = containerWidth - (GAP * (ITEMS_PER_ROW - 1));

  return (
    <div className="flex-1 overflow-y-auto p-2 pb-32" ref={containerRef}>
      <div className="flex flex-col" style={{ gap: `${GAP}px` }}>
        {rows.map((row, rowIndex) => {
          // Sum of aspect ratios for this row
          const totalAspectRatio = row.reduce((sum, item) => sum + item.aspectRatio, 0);
          // Row height that makes all items fit the available width
          const rowHeight = availableWidth / totalAspectRatio;

          return (
            <div 
              key={rowIndex} 
              className="flex"
              style={{ gap: `${GAP}px`, height: `${rowHeight}px` }}
            >
              {row.map((item) => {
                const itemWidth = rowHeight * item.aspectRatio;

                return item.type === 'loading' ? (
                  <div
                    key={item.id}
                    className="relative bg-muted/30 rounded-md overflow-hidden flex-shrink-0"
                    style={{ width: `${itemWidth}px`, height: '100%' }}
                  >
                    <LoadingCardContent ratio={item.ratio} />
                  </div>
                ) : (
                  <div
                    key={item.id}
                    className="relative group overflow-hidden rounded-md cursor-pointer flex-shrink-0"
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
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                    
                    {/* Top left - Select checkbox */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div 
                        className="w-5 h-5 rounded bg-white/90 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSelect?.(item.id);
                        }}
                      >
                        <Checkbox 
                          checked={selectedImages.includes(item.id)}
                          className="h-4 w-4 border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </div>
                    </div>

                    {/* Bottom controls */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {/* Edit button on left */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 bg-white/90 backdrop-blur-sm hover:bg-white text-foreground gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item.imageUrl);
                        }}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Edit</span>
                      </Button>

                      {/* More dropdown on right */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 bg-white/90 backdrop-blur-sm hover:bg-white text-foreground"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onImageClick(item.imageUrl, {
                                prompt: item.prompt,
                                ratio: item.ratio,
                                resolution: item.resolution,
                                timestamp: item.timestamp,
                                entryId: item.entryId,
                              });
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onRerun?.({ prompt: item.prompt, ratio: item.ratio, resolution: item.resolution });
                            }}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Re-run
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(item.imageUrl, item.index);
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item.entryId);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
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
