import React, { useState, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { X, Square, RectangleHorizontal, RectangleVertical, Smartphone, Monitor, Film, Image, Settings2, Sparkles, Plus, Minus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
}

const ratioOptions = [
  { value: '1:1', label: '1:1', icon: Square, desc: 'Square' },
  { value: '4:5', label: '4:5', icon: RectangleVertical, desc: 'Portrait' },
  { value: '3:4', label: '3:4', icon: RectangleVertical, desc: 'Portrait' },
  { value: '9:16', label: '9:16', icon: Smartphone, desc: 'Stories' },
  { value: '16:9', label: '16:9', icon: Monitor, desc: 'Landscape' },
  { value: '4:3', label: '4:3', icon: RectangleHorizontal, desc: 'Standard' },
  { value: '3:2', label: '3:2', icon: RectangleHorizontal, desc: 'Classic' },
  { value: '21:9', label: '21:9', icon: Film, desc: 'Cinematic' },
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
      setPrompt('');
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
      <div
        ref={setNodeRef}
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-3xl bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl transition-all duration-200 ${
          isOver ? 'ring-2 ring-primary scale-[1.02]' : ''
        }`}
      >
        <div className="flex items-center gap-3 p-3">
          {/* Selected Photos - Left */}
          {selectedPhotos.length > 0 && (
            <div className="flex items-center gap-1.5 flex-shrink-0 pr-3 border-r border-border/30">
              {selectedPhotos.slice(0, 4).map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.thumbnailSrc || photo.src}
                    alt={photo.name}
                    className="w-12 h-12 rounded-lg object-cover border border-border/50"
                  />
                  <button
                    onClick={() => onRemovePhoto(photo.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {selectedPhotos.length > 4 && (
                <span className="text-xs text-muted-foreground ml-1">+{selectedPhotos.length - 4}</span>
              )}
            </div>
          )}

          {/* Prompt Input - Center */}
          <div className="flex-1 min-w-0">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to create..."
              className="min-h-[44px] max-h-[80px] resize-none bg-transparent border-0 focus-visible:ring-0 text-sm placeholder:text-muted-foreground/60"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
          </div>

          {/* Controls - Right */}
          <div className="flex items-center gap-0.5 flex-shrink-0 pl-3 border-l border-border/30">
            {/* Aspect Ratio */}
            <Popover open={ratioOpen} onOpenChange={setRatioOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                  <currentRatio.icon className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 bg-popover" align="end">
                <div className="grid grid-cols-4 gap-1">
                  {ratioOptions.map((option) => (
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
                      <option.icon className="w-4 h-4" />
                      <span className="text-[10px] font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Resolution */}
            <Popover open={resolutionOpen} onOpenChange={setResolutionOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                  {currentResolution.label}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-28 p-1.5 bg-popover" align="end">
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

            {/* Photo Amount - Higgsfield style */}
            <div className="flex items-center h-8 px-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => setPhotoAmount(Math.max(1, photoAmount - 1))}
                disabled={photoAmount <= 1}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="text-sm font-medium w-5 text-center text-muted-foreground">{photoAmount}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => setPhotoAmount(Math.min(8, photoAmount + 1))}
                disabled={photoAmount >= 8}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Style Guide */}
            <Popover open={styleGuideOpen} onOpenChange={setStyleGuideOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${styleGuideUrl ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Image className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2 bg-popover" align="end">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Style Reference</p>
                  {styleGuideUrl ? (
                    <div className="relative">
                      <img
                        src={styleGuideUrl}
                        alt="Style guide"
                        className="w-full h-24 object-cover rounded-lg cursor-pointer"
                        onClick={() => {
                          setStyleGuideLightboxOpen(true);
                          setStyleGuideOpen(false);
                        }}
                      />
                      <button
                        onClick={() => setStyleGuideUrl(null)}
                        className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload</span>
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleStyleGuideUpload}
              className="hidden"
            />

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (!prompt.trim() && selectedPhotos.length === 0)}
              className="h-9 px-5 ml-2 bg-primary hover:bg-primary/90 font-medium"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Generate
            </Button>
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