import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react";
import { RecentGeneration } from "@/hooks/useRecentActivity";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface RecentActivityTableProps {
  generations: RecentGeneration[];
  loading?: boolean;
}

function truncateText(text: string | null, maxLength: number): string {
  if (!text) return "No prompt";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function ActivityRow({ generation }: { generation: RecentGeneration }) {
  const [isOpen, setIsOpen] = useState(false);
  const thumbnail = generation.images?.[0];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-4 p-4 hover:bg-muted/30 cursor-pointer transition-colors rounded-lg">
          {/* Thumbnail */}
          <div className="w-12 h-12 rounded-md bg-muted flex-shrink-0 overflow-hidden">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt="Generation thumbnail"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Prompt */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">
              {truncateText(generation.prompt, 60)}
            </p>
            <p className="text-xs text-muted-foreground">
              {generation.user_email ?? "Unknown user"}
            </p>
          </div>

          {/* Time ago */}
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(generation.created_at), {
              addSuffix: true,
            })}
          </div>

          {/* Expand icon */}
          <div className="text-muted-foreground">
            {isOpen ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-4 pb-4 pt-2 ml-16 space-y-3">
          {/* Full prompt */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Full Prompt
            </p>
            <p className="text-sm text-foreground">
              {generation.prompt || "No prompt provided"}
            </p>
          </div>

          {/* All images */}
          {generation.images && generation.images.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Generated Images ({generation.images.length})
              </p>
              <div className="flex gap-2 flex-wrap">
                {generation.images.map((img, idx) => (
                  <a
                    key={idx}
                    href={img}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-20 h-20 rounded-md overflow-hidden hover:ring-2 ring-primary transition-all"
                  >
                    <img
                      src={img}
                      alt={`Generated image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function RecentActivityTable({
  generations,
  loading,
}: RecentActivityTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-lg bg-muted/20 animate-pulse"
          >
            <div className="w-12 h-12 rounded-md bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-1/4 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No recent activity
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {generations.map((generation) => (
        <ActivityRow key={generation.id} generation={generation} />
      ))}
    </div>
  );
}
