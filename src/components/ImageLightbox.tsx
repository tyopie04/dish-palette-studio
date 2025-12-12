import { useState, useEffect } from "react";
import { X, Download, RefreshCw, Pencil, Trash2, Copy, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Info, Settings2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";

interface ImageLightboxProps {
  image: string;
  onClose: () => void;
  onEdit?: (image: string) => void;
  onDelete?: () => void;
  onRecreate?: () => void;
  prompt?: string;
  ratio?: string;
  resolution?: string;
  timestamp?: Date;
  onNavigate?: (direction: 'prev' | 'next') => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function ImageLightbox({ 
  image, 
  onClose, 
  onEdit, 
  onDelete,
  onRecreate,
  prompt,
  ratio, 
  resolution,
  timestamp,
  onNavigate,
  hasPrev = false,
  hasNext = false
}: ImageLightboxProps) {
  const [infoOpen, setInfoOpen] = useState(true);
  const [additionalOpen, setAdditionalOpen] = useState(true);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev && onNavigate) onNavigate('prev');
      if (e.key === "ArrowRight" && hasNext && onNavigate) onNavigate('next');
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, onNavigate, hasPrev, hasNext]);

  const handleDownload = async () => {
    try {
      if (image.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = image;
        link.download = `stax-content-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Image downloaded!');
        return;
      }
      
      const response = await fetch(image);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stax-content-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  const handleCopyPrompt = async () => {
    if (prompt) {
      await navigator.clipboard.writeText(prompt);
      toast.success('Prompt copied to clipboard!');
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  // Normalize ratio to standard formats (e.g., "24:43" -> "9:16")
  const normalizeRatio = (rawRatio: string): string => {
    const [w, h] = rawRatio.split(':').map(Number);
    if (isNaN(w) || isNaN(h)) return rawRatio;
    
    const aspectRatio = w / h;
    
    // Common aspect ratios with tolerance
    const standardRatios: { ratio: number; label: string }[] = [
      { ratio: 1, label: '1:1' },
      { ratio: 16 / 9, label: '16:9' },
      { ratio: 9 / 16, label: '9:16' },
      { ratio: 4 / 3, label: '4:3' },
      { ratio: 3 / 4, label: '3:4' },
      { ratio: 3 / 2, label: '3:2' },
      { ratio: 2 / 3, label: '2:3' },
      { ratio: 21 / 9, label: '21:9' },
      { ratio: 9 / 21, label: '9:21' },
    ];
    
    // Find closest standard ratio (within 5% tolerance)
    for (const std of standardRatios) {
      if (Math.abs(aspectRatio - std.ratio) / std.ratio < 0.05) {
        return std.label;
      }
    }
    
    // If no match, return a simplified version
    return rawRatio;
  };

  // Get quality display string
  const getQualityDisplay = () => {
    if (!resolution) return null;
    if (resolution === '4096') return '4K';
    if (resolution === '2048') return '2K';
    if (resolution === '1024') return '1K';
    if (resolution === 'Original') return 'Original';
    // Try to parse as number
    const num = parseInt(resolution);
    if (!isNaN(num)) {
      if (num >= 3840) return '4K';
      if (num >= 1920) return '2K';
      return '1K';
    }
    return resolution;
  };

  // Calculate image dimensions from resolution and ratio
  const [imageDimensions, setImageDimensions] = useState<string | null>(null);
  
  useEffect(() => {
    // Load the actual image to get real dimensions
    const img = new Image();
    img.onload = () => {
      setImageDimensions(`${img.naturalWidth}x${img.naturalHeight}`);
    };
    img.src = image;
  }, [image]);

  const formattedDate = timestamp 
    ? new Intl.DateTimeFormat('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(timestamp)
    : null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex"
      onClick={onClose}
    >
      {/* Close button - top right of image area */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-4 right-[340px] h-10 w-10 bg-white/10 hover:bg-white/20 text-white z-10 rounded-full"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <X className="w-5 h-5" />
      </Button>

      {/* Left Navigation Arrow */}
      {hasPrev && onNavigate && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-white/10 hover:bg-white/20 text-white z-10 rounded-full"
          onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
      )}

      {/* Right Navigation Arrow */}
      {hasNext && onNavigate && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-[340px] top-1/2 -translate-y-1/2 h-12 w-12 bg-white/10 hover:bg-white/20 text-white z-10 rounded-full mr-4"
          onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      )}

      {/* Main Image Area - clicking here closes lightbox */}
      <div 
        className="flex-1 flex items-center justify-center p-8"
      >
        <img
          src={image}
          alt="Generated content fullscreen"
          className="max-w-full max-h-full object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Right Sidebar Panel */}
      <div 
        className="w-80 bg-card border-l border-border flex flex-col h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Details</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Prompt Section */}
          {prompt && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Pencil className="w-4 h-4" />
                  PROMPT
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleCopyPrompt}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {prompt}
              </p>
            </div>
          )}

          {/* Information Section */}
          <Collapsible open={infoOpen} onOpenChange={setInfoOpen}>
            <CollapsibleTrigger className="w-full p-4 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Info className="w-4 h-4" />
                INFORMATION
              </div>
              {infoOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 space-y-3 border-b border-border">
                {getQualityDisplay() && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Quality</span>
                    <span className="text-sm font-medium text-foreground">
                      {getQualityDisplay()}
                    </span>
                  </div>
                )}
                {ratio && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Size</span>
                    <span className="text-sm font-medium text-foreground">{normalizeRatio(ratio)}</span>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Additional Section */}
          <Collapsible open={additionalOpen} onOpenChange={setAdditionalOpen}>
            <CollapsibleTrigger className="w-full p-4 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Settings2 className="w-4 h-4" />
                ADDITIONAL
              </div>
              {additionalOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 space-y-3 border-b border-border">
                {imageDimensions && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dimensions</span>
                    <span className="text-sm font-medium text-foreground">{imageDimensions}</span>
                  </div>
                )}
                {formattedDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="text-sm font-medium text-foreground">{formattedDate}</span>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-border space-y-2">
          {/* Recreate - Primary Button */}
          {onRecreate && (
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={onRecreate}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Recreate
            </Button>
          )}

          {/* Download & Edit Row */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {onEdit && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onEdit(image)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {/* Delete Row */}
          {onDelete && (
            <Button 
              variant="outline" 
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}