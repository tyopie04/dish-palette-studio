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
  { value: '1024', label: '1K' },
  { value: '2048', label: '2K' },
  { value: '4096', label: '4K' },
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
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-4xl bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl transition-all duration-200 ${
          isOver ? 'ring-2 ring-primary scale-[1.02]' : ''
        }`}
      >
        <div className="flex items-center gap-3 p-3">
          {/* Selected Photos */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            {selectedPhotos.slice(0, 4).map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.thumbnailSrc || photo.src}
                  alt={photo.name}
                  className="w-10 h-10 rounded-lg object-cover border border-border/50"
                />
                <button
                  onClick={() => onRemovePhoto(photo.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {selectedPhotos.length > 4 && (
              <span className="text-xs text-muted-foreground">+{selectedPhotos.length - 4}</span>
            )}
          </div>

          {/* Prompt Input */}
          <div className="flex-1 min-w-0">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to create..."
              className="min-h-[40px] max-h-[80px] resize-none bg-background/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Aspect Ratio */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
                  <currentRatio.icon className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="end">
                <div className="grid grid-cols-4 gap-1">
                  {ratioOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setRatio(option.value)}
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                  {currentResolution.label}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-32 p-2" align="end">
                <div className="flex flex-col gap-1">
                  {resolutionOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setResolution(option.value)}
                      className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
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
            <div className="flex items-center gap-1 px-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPhotoAmount(Math.max(1, photoAmount - 1))}
                disabled={photoAmount <= 1}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <span className="text-xs font-medium w-4 text-center">{photoAmount}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPhotoAmount(Math.min(4, photoAmount + 1))}
                disabled={photoAmount >= 4}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>

            {/* Style Guide */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-9 w-9 ${styleGuideUrl ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Image className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Style Reference</p>
                  {styleGuideUrl ? (
                    <div className="relative">
                      <img
                        src={styleGuideUrl}
                        alt="Style guide"
                        className="w-full h-24 object-cover rounded-lg cursor-pointer"
                        onClick={() => setStyleGuideLightboxOpen(true)}
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
              className="h-9 px-4 bg-primary hover:bg-primary/90"
            >
              <Sparkles className="w-4 h-4 mr-1" />
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
