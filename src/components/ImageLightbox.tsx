import { X, Download, Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useEffect } from "react";

interface ImageLightboxProps {
  image: string;
  onClose: () => void;
}

export function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

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
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center"
      onClick={onClose}
    >
      {/* Controls */}
      <div className="absolute top-6 right-6 flex gap-3 z-10">
        <Button 
          variant="glass" 
          size="icon" 
          className="h-12 w-12 bg-white/10 hover:bg-white/20 border-white/20"
          onClick={(e) => { e.stopPropagation(); handleDownload(); }}
        >
          <Download className="w-6 h-6 text-white" />
        </Button>
        <Button 
          variant="glass" 
          size="icon" 
          className="h-12 w-12 bg-white/10 hover:bg-white/20 border-white/20"
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
        >
          <Share2 className="w-6 h-6 text-white" />
        </Button>
        <Button 
          variant="glass" 
          size="icon" 
          className="h-12 w-12 bg-white/10 hover:bg-white/20 border-white/20"
          onClick={onClose}
        >
          <X className="w-6 h-6 text-white" />
        </Button>
      </div>
      
      {/* Centered image container */}
      <div className="w-full h-full flex items-center justify-center p-8">
        <img
          src={image}
          alt="Generated content fullscreen"
          className="max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain rounded-xl shadow-2xl animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Click anywhere hint */}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        Click anywhere or press Escape to close
      </p>
    </div>
  );
}