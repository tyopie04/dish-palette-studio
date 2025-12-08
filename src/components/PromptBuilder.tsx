import { useDroppable } from "@dnd-kit/core";
import { MenuPhoto } from "./PhotoCard";
import { X, Sparkles, Image as ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PromptBuilderProps {
  selectedPhotos: MenuPhoto[];
  onRemovePhoto: (id: string) => void;
  onGenerate: (prompt: string, style: string) => void;
  isGenerating: boolean;
}

const styleOptions = [
  { id: "social", label: "Social Media", description: "Instagram-ready square format" },
  { id: "banner", label: "Banner", description: "Wide promotional banner" },
  { id: "story", label: "Story", description: "Vertical story format" },
  { id: "artistic", label: "Artistic", description: "Creative artistic style" },
];

export function PromptBuilder({
  selectedPhotos,
  onRemovePhoto,
  onGenerate,
  isGenerating,
}: PromptBuilderProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("social");
  
  const { setNodeRef, isOver } = useDroppable({
    id: "prompt-builder",
  });

  const handleGenerate = () => {
    if (prompt.trim() || selectedPhotos.length > 0) {
      onGenerate(prompt, selectedStyle);
    }
  };

  return (
    <div className="glass-card p-6 space-y-6">
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
            <p className="text-sm">Drop menu photos here</p>
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
          placeholder="e.g., Create a festive holiday promotion featuring our signature dishes..."
          className="w-full h-24 px-4 py-3 bg-secondary/50 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-body"
        />
      </div>

      {/* Style Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Content Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          {styleOptions.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={cn(
                "p-3 rounded-lg border text-left transition-all duration-300",
                selectedStyle === style.id
                  ? "border-primary bg-primary/10 shadow-[0_0_15px_hsl(38_92%_50%/0.2)]"
                  : "border-border hover:border-primary/50 bg-secondary/30"
              )}
            >
              <p className="text-sm font-medium text-foreground">{style.label}</p>
              <p className="text-xs text-muted-foreground">{style.description}</p>
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
