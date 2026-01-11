import React, { useState, useRef, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { X, Image, Sparkles, Plus, Minus, Palette, ChevronDown, Check, ChevronUp, Pencil, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useActiveStyles, ActiveStyle } from '@/hooks/useActiveStyles';
import { cn } from '@/lib/utils';

// Default fallback style when no styles are active or selected
const FALLBACK_STYLE = {
  name: 'Default Style',
  prompt_modifier: 'Professional food photography, high-quality commercial style, appetizing presentation with perfect lighting and natural colors.',
};

interface MenuPhoto {
  id: string;
  name: string;
  src: string;
  category: string;
  thumbnailSrc?: string;
}

export interface StyleSnapshot {
  id?: string;
  name: string;
  prompt_modifier: string;
}

interface PromptBarProps {
  selectedPhotos: MenuPhoto[];
  onRemovePhoto: (id: string) => void;
  onAddExternalPhoto?: (photo: MenuPhoto) => void;
  onGenerate: (prompt: string, styleId?: string, styleSnapshot?: StyleSnapshot) => void;
  isGenerating: boolean;
  ratio: string;
  setRatio: (ratio: string) => void;
  resolution: string;
  setResolution: (resolution: string) => void;
  photoAmount: number;
  setPhotoAmount: (amount: number) => void;
  styleGuideUrl: string | null;
  setStyleGuideUrl: (url: string | null) => void;
  loadingCount?: number;
  selectedStyleId: string | null;
  setSelectedStyleId: (id: string | null) => void;
}

// Aspect ratio shapes - consistent simple rectangles
const ratioShapes: Record<string, { w: number; h: number }> = {
  "1:1": { w: 14, h: 14 },
  "4:5": { w: 12, h: 15 },
  "3:4": { w: 12, h: 16 },
  "9:16": { w: 10, h: 18 },
  "16:9": { w: 18, h: 10 },
  "4:3": { w: 16, h: 12 },
  "3:2": { w: 16, h: 11 },
  "21:9": { w: 20, h: 9 },
};

const ratioOptions = [
  { value: '1:1', label: '1:1', desc: 'Square' },
  { value: '4:5', label: '4:5', desc: 'Portrait' },
  { value: '3:4', label: '3:4', desc: 'Portrait' },
  { value: '9:16', label: '9:16', desc: 'Stories' },
  { value: '16:9', label: '16:9', desc: 'Landscape' },
  { value: '4:3', label: '4:3', desc: 'Standard' },
  { value: '3:2', label: '3:2', desc: 'Classic' },
  { value: '21:9', label: '21:9', desc: 'Cinematic' },
];

const resolutionOptions = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];

export const PromptBar: React.FC<PromptBarProps> = ({
  selectedPhotos,
  onRemovePhoto,
  onAddExternalPhoto,
  onGenerate,
  isGenerating,
  ratio,
  setRatio,
  resolution,
  setResolution,
  photoAmount,
  setPhotoAmount,
  styleGuideUrl,
  setStyleGuideUrl,
  loadingCount = 0,
  selectedStyleId,
  setSelectedStyleId,
}) => {
  const [prompt, setPrompt] = useState('');
  const [styleSnippet, setStyleSnippet] = useState('');
  const [styleSnippetExpanded, setStyleSnippetExpanded] = useState(false);
  const [styleGuideLightboxOpen, setStyleGuideLightboxOpen] = useState(false);
  const [ratioOpen, setRatioOpen] = useState(false);
  const [resolutionOpen, setResolutionOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [isStyleDragOver, setIsStyleDragOver] = useState(false);
  const [isPhotoDragOver, setIsPhotoDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: styles = [], isLoading: stylesLoading } = useActiveStyles();

  const { setNodeRef, isOver } = useDroppable({ id: 'prompt-bar-drop' });

  // Group styles by category
  const stylesByCategory = styles.reduce((acc, style) => {
    const cat = style.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(style);
    return acc;
  }, {} as Record<string, ActiveStyle[]>);

  const selectedStyle = styles.find(s => s.id === selectedStyleId);
  
  // Determine if we're using fallback (no styles available or none selected)
  const hasNoStyles = !stylesLoading && styles.length === 0;
  const usingFallback = hasNoStyles || (!selectedStyleId && !stylesLoading);
  const effectiveStyle = selectedStyle || (usingFallback ? FALLBACK_STYLE : null);

  // Update style snippet when selected style changes
  useEffect(() => {
    if (selectedStyle) {
      setStyleSnippet(selectedStyle.prompt_modifier);
      setStyleSnippetExpanded(false); // Keep collapsed by default
    } else if (usingFallback) {
      setStyleSnippet(FALLBACK_STYLE.prompt_modifier);
      setStyleSnippetExpanded(false);
    } else {
      setStyleSnippet('');
      setStyleSnippetExpanded(false);
    }
  }, [selectedStyleId, selectedStyle, usingFallback]);

  const handleStyleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsStyleDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setStyleGuideUrl(event.target?.result as string);
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleStyleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsStyleDragOver(true);
  };

  const handleStyleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsStyleDragOver(false);
  };

  // Handle external photo drop into the prompt bar
  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragOver(false);
    
    if (!onAddExternalPhoto) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const maxPhotos = 8;
      const availableSlots = maxPhotos - selectedPhotos.length;
      
      if (availableSlots <= 0) {
        return;
      }
      
      const filesToProcess = Array.from(files).slice(0, availableSlots);
      
      filesToProcess.forEach((file) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const photo: MenuPhoto = {
              id: `external-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name.replace(/\.[^/.]+$/, ''),
              src: dataUrl,
              category: 'External',
            };
            onAddExternalPhoto(photo);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };

  const handlePhotoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragOver(true);
  };

  const handlePhotoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPhotoDragOver(false);
  };

  const handleGenerate = () => {
    if (prompt.trim() || selectedPhotos.length > 0 || styleSnippet.trim()) {
      // Combine user prompt with style snippet (including fallback)
      const styleName = effectiveStyle?.name || 'Default';
      const fullPrompt = styleSnippet.trim() 
        ? `${prompt.trim()}${prompt.trim() ? '\n\n' : ''}[Style: ${styleName}]\n${styleSnippet.trim()}`
        : prompt.trim();
      
      // Create style snapshot for auditability
      const snapshot: StyleSnapshot | undefined = styleSnippet.trim() ? {
        id: selectedStyleId || undefined,
        name: styleName,
        prompt_modifier: styleSnippet.trim(),
      } : undefined;
      
      onGenerate(fullPrompt, selectedStyleId || undefined, snapshot);
    }
  };

  const handleStyleGuideUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setStyleGuideUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentRatio = ratioOptions.find(r => r.value === ratio) || ratioOptions[0];
  const currentResolution = resolutionOptions.find(r => r.value === resolution) || resolutionOptions[1];

  return (
    <>
      <div className="w-full flex justify-center px-4">
        {/* Main Prompt Container */}
        <div
          ref={setNodeRef}
          onDrop={handlePhotoDrop}
          onDragOver={handlePhotoDragOver}
          onDragLeave={handlePhotoDragLeave}
          className={`max-w-6xl w-full bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl transition-all duration-200 flex ${
            isOver || isPhotoDragOver ? 'ring-2 ring-primary scale-[1.02]' : ''
          }`}
        >
          {/* Left side: Content */}
          <div className="flex-1 flex flex-col">
            {/* Row 1: Selected Photos */}
            {selectedPhotos.length > 0 && (
              <div className="flex items-center gap-2 px-5 pt-4 pb-2 flex-wrap">
                {selectedPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.thumbnailSrc || photo.src}
                      alt={photo.name}
                      className="w-14 h-14 rounded-xl object-cover border border-border/50"
                    />
                    <button
                      onClick={() => onRemovePhoto(photo.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {/* Add more photos hint - only show if under limit */}
                {selectedPhotos.length < 8 && (
                  <button
                    className="w-14 h-14 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Row 2: Text Prompt */}
            <div className="px-5 py-4 flex-1 flex items-center gap-3">
              {/* Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors flex-shrink-0 self-center"
              >
                <Plus className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to create..."
                className="flex-1 bg-transparent border-0 outline-none text-base text-foreground placeholder:text-muted-foreground/60 caret-primary h-8 leading-8"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
            </div>

            {/* Style indicator removed - only ring on button shows selection */}

            {/* Row 3: Controls */}
            <div className="flex items-center gap-1 px-4 pb-4">
              {/* Aspect Ratio */}
              <Popover open={ratioOpen} onOpenChange={setRatioOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-3 gap-2 rounded-full border-border/50 bg-muted/30 hover:bg-muted/50">
                    <div 
                      className="border-2 border-current rounded-sm"
                      style={{ 
                        width: ratioShapes[ratio]?.w || 14, 
                        height: ratioShapes[ratio]?.h || 14 
                      }}
                    />
                    <span className="text-sm font-medium">{ratio}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2 bg-popover" align="start">
                  <div className="grid grid-cols-4 gap-1">
                    {ratioOptions.map((option) => {
                      const shape = ratioShapes[option.value];
                      return (
                        <button
                          key={option.value}
                          onClick={() => {
                            setRatio(option.value);
                            setRatioOpen(false);
                          }}
                          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                            ratio === option.value
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          <div 
                            className="border-2 border-current rounded-sm"
                            style={{ width: shape.w, height: shape.h }}
                          />
                          <span className="text-[10px] font-medium">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Resolution */}
              <Popover open={resolutionOpen} onOpenChange={setResolutionOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-3 gap-1.5 rounded-full border-border/50 bg-muted/30 hover:bg-muted/50">
                    <span className="text-sm font-medium">{currentResolution.label}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-28 p-1.5 bg-popover" align="start">
                  <div className="flex flex-col gap-0.5">
                    {resolutionOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setResolution(option.value);
                          setResolutionOpen(false);
                        }}
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors text-center ${
                          resolution === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Style Selector */}
              <Popover open={styleOpen} onOpenChange={setStyleOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "h-9 px-3 gap-2 rounded-full border-border/50 bg-muted/30 hover:bg-muted/50",
                      selectedStyle && "border-primary/50"
                    )}
                  >
                    <Palette className="w-4 h-4" />
                    <span className="text-sm font-medium max-w-[80px] truncate">
                      {selectedStyle?.name || 'Style'}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2 bg-popover max-h-80 overflow-y-auto" align="start">
                  {stylesLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Loading styles...</div>
                  ) : styles.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No styles available</div>
                  ) : (
                    <div className="space-y-3">
                      {/* None option */}
                      <button
                        onClick={() => {
                          setSelectedStyleId(null);
                          setStyleOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                          !selectedStyleId ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                      >
                        <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center">
                          <X className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">No Style</p>
                          <p className="text-xs opacity-70">Use default generation</p>
                        </div>
                      </button>
                      
                      {/* Styles grouped by category */}
                      {Object.entries(stylesByCategory).map(([category, categoryStyles]) => (
                        <div key={category}>
                          <p className="text-xs font-medium text-muted-foreground px-2 py-1">{category}</p>
                          <div className="space-y-0.5">
                            {categoryStyles.map((style) => (
                              <button
                                key={style.id}
                                onClick={() => {
                                  setSelectedStyleId(style.id);
                                  setStyleOpen(false);
                                }}
                                className={cn(
                                  "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                                  selectedStyleId === style.id 
                                    ? "bg-primary text-primary-foreground" 
                                    : "hover:bg-muted"
                                )}
                              >
                                {style.thumbnail_url ? (
                                  <img 
                                    src={style.thumbnail_url} 
                                    alt={style.name} 
                                    className="w-8 h-8 rounded-md object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center">
                                    <Palette className="w-4 h-4" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium truncate">{style.name}</p>
                                    {style.is_default && (
                                      <span className="text-[10px] bg-primary/20 text-primary px-1 rounded">Default</span>
                                    )}
                                  </div>
                                  {style.description && (
                                    <p className="text-xs opacity-70 truncate">{style.description}</p>
                                  )}
                                </div>
                                {selectedStyleId === style.id && (
                                  <Check className="w-4 h-4 flex-shrink-0" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* Photo Amount */}
              <div className="flex items-center h-9 px-2 rounded-full border border-border/50 bg-muted/30">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setPhotoAmount(Math.max(1, photoAmount - 1))}
                  disabled={photoAmount <= 1}
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <span className="text-sm font-medium w-6 text-center">{photoAmount}/4</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => setPhotoAmount(Math.min(4, photoAmount + 1))}
                  disabled={photoAmount >= 4}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

            </div>
          </div>

          {/* Right side: Generate Button - fills full height with thicker padding (80% size) */}
          <div className="p-5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleGenerate}
                    disabled={loadingCount >= 8 || (!prompt.trim() && selectedPhotos.length === 0)}
                    className="h-full px-8 rounded-2xl bg-primary hover:bg-primary/90 font-semibold text-sm shadow-lg"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate
                  </Button>
                </TooltipTrigger>
                {loadingCount >= 8 && (
                  <TooltipContent>
                    <p>Generation limit reached — please wait for current images to complete</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Style Guide Lightbox */}
      <Dialog open={styleGuideLightboxOpen} onOpenChange={setStyleGuideLightboxOpen}>
        <DialogContent className="max-w-3xl p-0 bg-transparent border-0">
          {styleGuideUrl && (
            <img src={styleGuideUrl} alt="Style guide" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};