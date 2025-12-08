import { Download, Share2, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface GeneratedContentProps {
  images: string[];
  onRegenerate: () => void;
}

export function GeneratedContent({ images, onRegenerate }: GeneratedContentProps) {
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

      <div className="grid grid-cols-1 gap-3">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative group rounded-lg overflow-hidden"
          >
            <img
              src={image}
              alt={`Generated content ${index + 1}`}
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
              <Button 
                variant="glass" 
                size="icon" 
                className="h-10 w-10"
                onClick={() => handleDownload(image, index)}
              >
                <Download className="w-5 h-5" />
              </Button>
              <Button 
                variant="glass" 
                size="icon" 
                className="h-10 w-10"
                onClick={() => handleShare(image)}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
