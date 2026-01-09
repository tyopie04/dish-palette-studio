import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  value: number | string;
  label: string;
  icon?: LucideIcon;
  loading?: boolean;
  href?: string;
}

export function StatsCard({ value, label, icon: Icon, loading, href }: StatsCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (href) {
      navigate(href);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "rounded-lg border border-border/50 bg-card p-6 flex items-start justify-between transition-colors",
        href && "cursor-pointer hover:bg-muted/50 hover:border-primary/30"
      )}
    >
      <div className="space-y-1">
        {loading ? (
          <div className="h-9 w-16 bg-muted animate-pulse rounded" />
        ) : (
          <p className="text-3xl font-bold text-foreground">{value}</p>
        )}
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      {Icon && (
        <div className="p-2 rounded-md bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      )}
    </div>
  );
}
