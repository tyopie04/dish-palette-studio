import { X, Download, Share2, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useEffect } from "react";

interface ImageLightboxProps {
  image: string;
  onClose: () => void;
  onEdit?: (image: string) => void;
}

export function ImageLightbox({ image, onClose, onEdit }: ImageLightboxProps) {
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
      {/* Close button - top right */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-4 right-4 h-10 w-10 bg-white/10 hover:bg-white/20 text-white z-10 rounded-full"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <X className="w-5 h-5" />
      </Button>
      
      {/* Centered content container */}
      <div 
        className="flex flex-col items-center gap-4 max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <img
          src={image}
          alt="Generated content fullscreen"
          className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
        />

        {/* Action buttons below image */}
        <div className="flex gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="bg-white/10 hover:bg-white/20 text-white"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="bg-white/10 hover:bg-white/20 text-white"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          {onEdit && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="bg-white/10 hover:bg-white/20 text-white"
              onClick={() => onEdit(image)}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Click anywhere hint */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm pointer-events-none">
        Click outside or press Escape to close
      </p>
    </div>
  );
}
