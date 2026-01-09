import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  value: number | string;
  label: string;
  icon?: LucideIcon;
  loading?: boolean;
}

export function StatsCard({ value, label, icon: Icon, loading }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-card p-6 flex items-start justify-between">
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
