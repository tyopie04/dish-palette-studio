import React, { useState, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { X, Image, Sparkles, Plus, Minus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
interface MenuPhoto {
  id: string;
  name: string;
  src: string;
  category: string;
  thumbnailSrc?: string;
}

interface PromptBarProps {
  selectedPhotos: MenuPhoto[];
  onRemovePhoto: (id: string) => void;
  onGenerate: (prompt: string) => void;
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
}) => {
  const [prompt, setPrompt] = useState('');
  const [styleGuideLightboxOpen, setStyleGuideLightboxOpen] = useState(false);
  const [ratioOpen, setRatioOpen] = useState(false);
  const [resolutionOpen, setResolutionOpen] = useState(false);
  const [styleGuideOpen, setStyleGuideOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { setNodeRef, isOver } = useDroppable({ id: 'prompt-bar-drop' });

  const handleGenerate = () => {
    if (prompt.trim() || selectedPhotos.length > 0) {
      onGenerate(prompt);
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
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ml-[150px]">
        {/* Main Prompt Container */}
        <div
          ref={setNodeRef}
          className={`w-[calc(100vw-380px)] max-w-5xl bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl transition-all duration-200 flex ${
            isOver ? 'ring-2 ring-primary scale-[1.02]' : ''
          }`}
        >
          {/* Left side: Content */}
          <div className="flex-1 flex flex-col">
            {/* Row 1: Selected Photos */}
            {selectedPhotos.length > 0 && (
              <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                {selectedPhotos.slice(0, 6).map((photo) => (
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
                {selectedPhotos.length > 6 && (
                  <span className="text-xs text-muted-foreground ml-1">+{selectedPhotos.length - 6}</span>
                )}
                {/* Add more photos button */}
                <button
                  className="w-14 h-14 rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
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

              {/* Style Guide (hidden button - upload via + button now) */}
              {styleGuideUrl && (
                <div className="relative">
                  <img
                    src={styleGuideUrl}
                    alt="Style guide"
                    className="w-9 h-9 object-cover rounded-full cursor-pointer border border-border/50"
                    onClick={() => setStyleGuideLightboxOpen(true)}
                  />
                  <button
                    onClick={() => setStyleGuideUrl(null)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleStyleGuideUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Right side: Generate Button - fills full height with thicker padding (80% size) */}
          <div className="p-5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || loadingCount >= 8 || (!prompt.trim() && selectedPhotos.length === 0)}
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