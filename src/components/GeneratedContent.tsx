import { Download, Share2, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface GeneratedContentProps {
  images: string[];
  onRegenerate: () => void;
}

export function GeneratedContent({ images, onRegenerate }: GeneratedContentProps) {
  if (images.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
            <span className="text-3xl">✨</span>
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground mb-2">
            Your Creations
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Generated content will appear here. Start by adding photos and a prompt!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold text-foreground">
          Generated Content
        </h3>
        <Button variant="ghost" size="sm" onClick={onRegenerate}>
          <RefreshCw className="w-4 h-4" />
          Regenerate
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative group rounded-lg overflow-hidden aspect-square"
          >
            <img
              src={image}
              alt={`Generated content ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
              <Button variant="glass" size="icon" className="h-9 w-9">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="glass" size="icon" className="h-9 w-9">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
