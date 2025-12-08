import { useDroppable } from "@dnd-kit/core";
import { MenuPhoto } from "./PhotoCard";
import { X, Sparkles, Image as ImageIcon, Palette } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ImageLightbox } from "./ImageLightbox";

interface PromptBuilderProps {
  selectedPhotos: MenuPhoto[];
  onRemovePhoto: (id: string) => void;
  onGenerate: (prompt: string, ratio: string, resolution: string, photoAmount: string, styleGuideUrl?: string) => void;
  selectedRatio: string;
  setSelectedRatio: (ratio: string) => void;
  selectedResolution: string;
  setSelectedResolution: (resolution: string) => void;
  selectedPhotoAmount: string;
  setSelectedPhotoAmount: (amount: string) => void;
  styleGuideUrl: string | null;
  setStyleGuideUrl: (url: string | null) => void;
}

// Aspect ratio visual shapes
const ratioShapes: Record<string, { w: number; h: number }> = {
  "1:1": { w: 16, h: 16 },
  "16:9": { w: 20, h: 11 },
  "9:16": { w: 11, h: 20 },
  "4:3": { w: 18, h: 14 },
};

const ratioOptions = [
  { id: "1:1", label: "1:1", description: "Square" },
  { id: "16:9", label: "16:9", description: "Landscape" },
  { id: "9:16", label: "9:16", description: "Portrait" },
  { id: "4:3", label: "4:3", description: "Standard" },
];

const resolutionOptions = [
  { id: "1K", label: "1K", description: "1024px" },
  { id: "2K", label: "2K", description: "2048px" },
  { id: "4K", label: "4K", description: "4096px" },
];

const photoAmountOptions = [
  { id: "1", label: "One", description: "1 image" },
  { id: "2", label: "Two", description: "2 images" },
  { id: "4", label: "Four", description: "4 images" },
];

export function PromptBuilder({
  selectedPhotos,
  onRemovePhoto,
  onGenerate,
  selectedRatio,
  setSelectedRatio,
  selectedResolution,
  setSelectedResolution,
  selectedPhotoAmount,
  setSelectedPhotoAmount,
  styleGuideUrl,
  setStyleGuideUrl,
}: PromptBuilderProps) {
  const [prompt, setPrompt] = useState("");
  const [styleGuideLightboxOpen, setStyleGuideLightboxOpen] = useState(false);
  
  const { setNodeRef, isOver } = useDroppable({
    id: "prompt-builder",
  });

  const handleStyleGuideUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setStyleGuideUrl(url);
    }
  };

  const handleGenerate = () => {
    if (prompt.trim() || selectedPhotos.length > 0) {
      onGenerate(prompt, selectedRatio, selectedResolution, selectedPhotoAmount, styleGuideUrl || undefined);
    }
  };

  return (
    <div className="glass-card p-6 space-y-5">
      <div>
        <h2 className="text-xl font-display font-semibold text-foreground mb-1">
          Content Creator
        </h2>
        <p className="text-sm text-muted-foreground">
          Drop photos and describe the content you want to create
        </p>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "drop-zone min-h-[120px] p-4 flex flex-wrap gap-3 items-start",
          isOver && "drop-zone-active",
          selectedPhotos.length === 0 && "items-center justify-center"
        )}
      >
        {selectedPhotos.length === 0 ? (
          <div className="text-center text-muted-foreground">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Drop burger photos here</p>
          </div>
        ) : (
          selectedPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative group w-20 h-20 rounded-lg overflow-visible"
            >
              <img
                src={photo.src}
                alt={photo.name}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={() => onRemovePhoto(photo.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md border-2 border-background"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Prompt Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Describe your content
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Create a promotional shot of our signature burgers with dramatic lighting..."
          className="w-full h-24 px-4 py-3 bg-secondary/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-body"
        />
      </div>

      {/* Style Guide */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Style Guide (optional)
        </label>
        <p className="text-xs text-muted-foreground">
          Upload an image to replicate its style (lighting, composition, colors). Food in this image won't be used.
        </p>
        {styleGuideUrl ? (
          <div className="relative group w-full h-24 rounded-lg overflow-hidden border border-border">
            <img
              src={styleGuideUrl}
              alt="Style guide"
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setStyleGuideLightboxOpen(true)}
            />
            <button
              onClick={(e) => { e.stopPropagation(); setStyleGuideUrl(null); }}
              className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-2 py-1 pointer-events-none">
              <p className="text-xs text-muted-foreground">Click to enlarge • Style reference</p>
            </div>
          </div>
        ) : (
          <label 
            className="block w-full p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors text-center"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.classList.add('border-primary', 'bg-primary/5');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
              const files = e.dataTransfer.files;
              if (files.length > 0 && files[0].type.startsWith('image/')) {
                const url = URL.createObjectURL(files[0]);
                setStyleGuideUrl(url);
              }
            }}
          >
            <Palette className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click or drag image here</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleStyleGuideUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Ratio Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Aspect Ratio
        </label>
        <div className="grid grid-cols-4 gap-2">
          {ratioOptions.map((ratio) => {
            const shape = ratioShapes[ratio.id];
            return (
              <button
                key={ratio.id}
                onClick={() => setSelectedRatio(ratio.id)}
                className={cn(
                  "p-2 rounded-lg border text-center transition-all duration-300 flex flex-col items-center gap-2",
                  selectedRatio === ratio.id
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_hsl(48_96%_53%/0.2)]"
                    : "border-border hover:border-primary/50 bg-secondary/30"
                )}
              >
                {/* Aspect ratio shape indicator */}
                <div 
                  className="border-2 border-current rounded-sm"
                  style={{ 
                    width: shape.w, 
                    height: shape.h,
                    opacity: selectedRatio === ratio.id ? 1 : 0.5 
                  }}
                />
                <div>
                  <p className="text-xs font-medium text-foreground">{ratio.label}</p>
                  <p className="text-[10px] text-muted-foreground">{ratio.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resolution Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Resolution
        </label>
        <div className="grid grid-cols-3 gap-2">
          {resolutionOptions.map((res) => (
            <button
              key={res.id}
              onClick={() => setSelectedResolution(res.id)}
              className={cn(
                "p-2 rounded-lg border text-center transition-all duration-300",
                selectedResolution === res.id
                  ? "border-primary bg-primary/10 shadow-[0_0_15px_hsl(48_96%_53%/0.2)]"
                  : "border-border hover:border-primary/50 bg-secondary/30"
              )}
            >
              <p className="text-sm font-medium text-foreground">{res.label}</p>
              <p className="text-xs text-muted-foreground">{res.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Photo Amount Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Photo Amount
        </label>
        <div className="grid grid-cols-3 gap-2">
          {photoAmountOptions.map((amt) => (
            <button
              key={amt.id}
              onClick={() => setSelectedPhotoAmount(amt.id)}
              className={cn(
                "p-2 rounded-lg border text-center transition-all duration-300",
                selectedPhotoAmount === amt.id
                  ? "border-primary bg-primary/10 shadow-[0_0_15px_hsl(48_96%_53%/0.2)]"
                  : "border-border hover:border-primary/50 bg-secondary/30"
              )}
            >
              <p className="text-sm font-medium text-foreground">{amt.label}</p>
              <p className="text-xs text-muted-foreground">{amt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <Button
        variant="glow"
        size="lg"
        className="w-full"
        onClick={handleGenerate}
        disabled={selectedPhotos.length === 0 && !prompt.trim()}
      >
        <Sparkles className="w-4 h-4" />
        Generate Content
      </Button>

      {/* Style Guide Lightbox */}
      {styleGuideUrl && styleGuideLightboxOpen && (
        <ImageLightbox
          image={styleGuideUrl}
          onClose={() => setStyleGuideLightboxOpen(false)}
        />
      )}
    </div>
  );
}
