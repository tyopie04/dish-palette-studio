import { useDroppable } from "@dnd-kit/core";
import { MenuPhoto } from "./PhotoCard";
import { X, Sparkles, Image as ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PromptBuilderProps {
  selectedPhotos: MenuPhoto[];
  onRemovePhoto: (id: string) => void;
  onGenerate: (prompt: string, ratio: string, resolution: string) => void;
  isGenerating: boolean;
}

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

export function PromptBuilder({
  selectedPhotos,
  onRemovePhoto,
  onGenerate,
  isGenerating,
}: PromptBuilderProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedRatio, setSelectedRatio] = useState("1:1");
  const [selectedResolution, setSelectedResolution] = useState("1K");
  
  const { setNodeRef, isOver } = useDroppable({
    id: "prompt-builder",
  });

  const handleGenerate = () => {
    if (prompt.trim() || selectedPhotos.length > 0) {
      onGenerate(prompt, selectedRatio, selectedResolution);
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
              className="relative group w-20 h-20 rounded-lg overflow-hidden"
            >
              <img
                src={photo.src}
                alt={photo.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onRemovePhoto(photo.id)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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

      {/* Ratio Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Aspect Ratio
        </label>
        <div className="grid grid-cols-4 gap-2">
          {ratioOptions.map((ratio) => (
            <button
              key={ratio.id}
              onClick={() => setSelectedRatio(ratio.id)}
              className={cn(
                "p-2 rounded-lg border text-center transition-all duration-300",
                selectedRatio === ratio.id
                  ? "border-primary bg-primary/10 shadow-[0_0_15px_hsl(38_92%_50%/0.2)]"
                  : "border-border hover:border-primary/50 bg-secondary/30"
              )}
            >
              <p className="text-sm font-medium text-foreground">{ratio.label}</p>
              <p className="text-xs text-muted-foreground">{ratio.description}</p>
            </button>
          ))}
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
                  ? "border-primary bg-primary/10 shadow-[0_0_15px_hsl(38_92%_50%/0.2)]"
                  : "border-border hover:border-primary/50 bg-secondary/30"
              )}
            >
              <p className="text-sm font-medium text-foreground">{res.label}</p>
              <p className="text-xs text-muted-foreground">{res.description}</p>
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
        disabled={isGenerating || (selectedPhotos.length === 0 && !prompt.trim())}
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Generate Content
          </>
        )}
      </Button>
    </div>
  );
}
