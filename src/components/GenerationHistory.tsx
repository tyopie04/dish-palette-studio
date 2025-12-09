import { Download, Trash2, Shuffle } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export interface GenerationEntry {
  id: string;
  images: string[];
  timestamp: Date;
  isLoading?: boolean;
  ratio?: string;
  resolution?: string;
}

interface GenerationHistoryProps {
  history: GenerationEntry[];
  onImageClick: (image: string, ratio?: string, resolution?: string) => void;
  onDeleteEntry: (id: string) => void;
  onDeleteImage: (entryId: string, imageIndex: number) => void;
  onGenerateNew: () => void;
}

// Loading timer component
function LoadingTimer({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0);
  const estimatedTime = 30; // 30 seconds estimated

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const progress = Math.min((elapsed / estimatedTime) * 100, 95);
  const remaining = Math.max(estimatedTime - elapsed, 0);

  return (
    <div className="space-y-2 w-full px-4">
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {remaining > 0 ? `~${remaining}s remaining` : "Almost there..."}
      </p>
    </div>
  );
}

export function GenerationHistory({
  history,
  onImageClick,
  onDeleteEntry,
  onDeleteImage,
  onGenerateNew,
}: GenerationHistoryProps) {
  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      if (imageUrl.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `stax-content-${Date.now()}-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Image downloaded!");
        return;
      }

      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `stax-content-${Date.now()}-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download image");
    }
  };

  return (
    <div className="glass-card p-6 space-y-4 h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold text-foreground">
          Generated Content
        </h3>
      </div>

      {/* Choose for Me button at top */}
      <Button
        variant="glow"
        className="w-full flex-shrink-0"
        onClick={onGenerateNew}
      >
        <Shuffle className="w-4 h-4 mr-2" />
        Choose for Me
      </Button>

      {/* Scrollable history with fixed height */}
      <ScrollArea className="flex-1 min-h-0 -mx-2 px-2">
        <div className="space-y-6">
          {history.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                <span className="text-3xl">✨</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Generated content will appear here
              </p>
            </div>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {entry.isLoading ? "Generating..." : (
                      <>
                        {entry.timestamp.toLocaleDateString()} at{" "}
                        {entry.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </>
                    )}
                  </span>
                  {!entry.isLoading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-destructive hover:text-destructive"
                      onClick={() => onDeleteEntry(entry.id)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>

                <div className="grid gap-3">
                  {entry.isLoading ? (
                    <div className="relative rounded-lg overflow-hidden border border-border bg-secondary/30 aspect-square flex items-center justify-center">
                      <div className="flex flex-col items-center justify-center gap-4 w-full">
                        {/* Animated shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/50 to-transparent animate-shimmer" />
                        
                        {/* Spinning loader */}
                        <div className="relative z-10 w-12 h-12 border-3 border-border border-t-primary rounded-full animate-spin" />
                        
                        {/* Pulsing text */}
                        <p className="relative z-10 text-sm text-muted-foreground animate-pulse">
                          Creating your masterpiece...
                        </p>
                        
                        {/* Time remaining bar */}
                        <LoadingTimer startTime={entry.timestamp} />
                      </div>
                    </div>
                  ) : (
                    entry.images.map((image, imgIndex) => (
                      <div key={imgIndex} className="space-y-2">
                        <div
                          className="relative group rounded-lg overflow-hidden cursor-pointer border border-border"
                          onClick={() => onImageClick(image, entry.ratio, entry.resolution)}
                        >
                          <img
                            src={image}
                            alt={`Generated content ${imgIndex + 1}`}
                            className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <p className="text-sm text-foreground">
                              Click to enlarge
                            </p>
                          </div>
                        </div>

                        {/* Action buttons below each image */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDownload(image, imgIndex)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDeleteImage(entry.id, imgIndex)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
