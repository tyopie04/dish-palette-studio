import { X, Image as ImageIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrganizationDetails } from "@/hooks/useOrganizations";
import { formatDistanceToNow, format } from "date-fns";
import { StatsCard } from "./StatsCard";

interface ClientDetailPanelProps {
  organizationId: string | null;
  onClose: () => void;
}

export function ClientDetailPanel({ organizationId, onClose }: ClientDetailPanelProps) {
  const { data, isLoading } = useOrganizationDetails(organizationId);

  if (!organizationId) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-card border-l border-border shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">
          {isLoading ? "Loading..." : data?.organization?.name ?? "Client Details"}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-4">
            <div className="h-24 bg-muted animate-pulse rounded-lg" />
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
          </div>
        ) : data ? (
          <div className="p-4 space-y-6">
            {/* Organization Info */}
            <div className="flex items-center gap-4">
              {data.organization.logo_url ? (
                <img
                  src={data.organization.logo_url}
                  alt={data.organization.name}
                  className="w-16 h-16 rounded-lg object-contain border border-border"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: data.organization.primary_color || "#ff6b35" }}
                >
                  {data.organization.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{data.organization.name}</h3>
                <p className="text-sm text-muted-foreground">/{data.organization.slug}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Created {format(new Date(data.organization.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatsCard
                value={data.generations.length}
                label="Total Generations"
                icon={Sparkles}
              />
              <StatsCard
                value={data.menuPhotos.length}
                label="Menu Photos"
                icon={ImageIcon}
              />
            </div>

            {/* Menu Photos */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Menu Photos</h4>
              {data.menuPhotos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No menu photos yet</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {data.menuPhotos.map((photo) => (
                    <a
                      key={photo.id}
                      href={photo.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-md overflow-hidden hover:ring-2 ring-primary transition-all"
                    >
                      <img
                        src={photo.thumbnail_url || photo.original_url}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Generations */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Recent Generations</h4>
              {data.generations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No generations yet</p>
              ) : (
                <div className="space-y-2">
                  {data.generations.map((gen) => (
                    <div
                      key={gen.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                    >
                      <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                        {gen.images?.[0] ? (
                          <img
                            src={gen.images[0]}
                            alt="Generation"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">
                          {gen.prompt || "No prompt"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(gen.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Failed to load client details
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
