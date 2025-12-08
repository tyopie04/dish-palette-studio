import { X, Download, Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ImageLightboxProps {
  image: string;
  onClose: () => void;
}

export function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  const handleDownload = async () => {
    try {
      if (image.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = image;
        link.download = `burger-content.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Image downloaded!');
        return;
      }
      
      const response = await fetch(image);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `burger-content.png`;
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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Burger Content',
          text: 'Check out this burger content!',
          url: image.startsWith('data:') ? window.location.href : image,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute top-4 right-4 flex gap-2">
        <Button variant="glass" size="icon" onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
          <Download className="w-5 h-5" />
        </Button>
        <Button variant="glass" size="icon" onClick={(e) => { e.stopPropagation(); handleShare(); }}>
          <Share2 className="w-5 h-5" />
        </Button>
        <Button variant="glass" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <img
        src={image}
        alt="Generated content fullscreen"
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}