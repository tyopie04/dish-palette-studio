import { useState } from "react";
import { Download, Share2, RefreshCw, Shuffle } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { ImageLightbox } from "./ImageLightbox";

interface GeneratedContentProps {
  images: string[];
  onRegenerate: () => void;
  onGenerateRandom?: () => void;
  isGenerating?: boolean;
}

export function GeneratedContent({ images, onRegenerate, onGenerateRandom, isGenerating = false }: GeneratedContentProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      // For base64 images, create a download link directly
      if (imageUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `burger-content-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Image downloaded!');
        return;
      }
      
      // For regular URLs, fetch and download
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `burger-content-${index + 1}.png`;
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

  const handleShare = async (imageUrl: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Burger Content',
          text: 'Check out this burger content!',
          url: imageUrl.startsWith('data:') ? window.location.href : imageUrl,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  if (isGenerating) {
    return (
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-semibold text-foreground">
            Generating...
          </h3>
        </div>
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-muted">
            <div className="aspect-square w-full animate-pulse bg-gradient-to-br from-muted via-muted-foreground/10 to-muted" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Creating your content...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <div className="py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
            <span className="text-3xl">✨</span>
          </div>
          <h3 className="text-lg font-display font-semibold text-foreground mb-2">
            Your Creations
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
            Generated content will appear here. Start by adding photos and a prompt!
          </p>
          {onGenerateRandom && (
            <Button 
              variant="glow" 
              onClick={onGenerateRandom}
              className="mt-2"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Generate Random
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-display font-semibold text-foreground">
          Generated Content
        </h3>
        <div className="flex gap-2">
          {onGenerateRandom && (
            <Button variant="outline" size="sm" onClick={onGenerateRandom}>
              <Shuffle className="w-4 h-4" />
              Random
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onRegenerate}>
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative group rounded-lg overflow-hidden cursor-pointer"
            onClick={() => setLightboxImage(image)}
          >
            <img
              src={image}
              alt={`Generated content ${index + 1}`}
              className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
              <Button 
                variant="glass" 
                size="icon" 
                className="h-10 w-10"
                onClick={(e) => { e.stopPropagation(); handleDownload(image, index); }}
              >
                <Download className="w-5 h-5" />
              </Button>
              <Button 
                variant="glass" 
                size="icon" 
                className="h-10 w-10"
                onClick={(e) => { e.stopPropagation(); handleShare(image); }}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
            <p className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/60 px-2 py-1 rounded">
              Click to enlarge
            </p>
          </div>
        ))}
      </div>

      {lightboxImage && (
        <ImageLightbox 
          image={lightboxImage} 
          onClose={() => setLightboxImage(null)} 
        />
      )}
    </div>
  );
}
