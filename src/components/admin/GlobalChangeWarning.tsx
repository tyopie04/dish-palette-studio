import { AlertTriangle, Globe, Info } from 'lucide-react';
import { GlobalChangeInfo } from '@/hooks/useGlobalChangeDetection';
import { cn } from '@/lib/utils';

interface GlobalChangeWarningProps {
  changeInfo: GlobalChangeInfo;
  className?: string;
}

export function GlobalChangeWarning({ changeInfo, className }: GlobalChangeWarningProps) {
  if (!changeInfo.isGlobalChange || !changeInfo.warningMessage) {
    return null;
  }

  const isCritical = changeInfo.severity === 'critical';

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        isCritical 
          ? "bg-destructive/10 border-destructive/30 text-destructive" 
          : "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
        className
      )}
    >
      <div className={cn(
        "p-1.5 rounded-full flex-shrink-0",
        isCritical ? "bg-destructive/20" : "bg-amber-500/20"
      )}>
        {isCritical ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <Globe className="w-4 h-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {isCritical ? 'Critical Global Change' : 'Global Change'}
        </p>
        <p className="text-xs mt-0.5 opacity-90">
          {changeInfo.warningMessage}
        </p>
        {changeInfo.affectedScope === 'all_clients' && (
          <p className="text-[10px] mt-1.5 opacity-70 flex items-center gap-1">
            <Info className="w-3 h-3" />
            This affects all client applications
          </p>
        )}
      </div>
    </div>
  );
}

interface GlobalChangeBadgeProps {
  isGlobal: boolean;
  className?: string;
}

export function GlobalChangeBadge({ isGlobal, className }: GlobalChangeBadgeProps) {
  if (!isGlobal) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
        className
      )}
    >
      <Globe className="w-3 h-3" />
      Global Change
    </span>
  );
}
