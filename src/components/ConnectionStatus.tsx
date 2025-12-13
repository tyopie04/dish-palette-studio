import { Loader2, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'reconnecting' | 'error';
  retryCount?: number;
  onRetry?: () => void;
}

export function ConnectionStatus({ status, retryCount = 0, onRetry }: ConnectionStatusProps) {
  if (status === 'connected') return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium transition-all duration-300",
        status === 'error' && "bg-destructive text-destructive-foreground",
        status === 'connecting' && "bg-muted text-muted-foreground",
        status === 'reconnecting' && "bg-amber-500/20 text-amber-700 dark:text-amber-400"
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {status === 'connecting' && (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting to server...</span>
          </>
        )}
        
        {status === 'reconnecting' && (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>
              Server is waking up... Retry {retryCount}/5
            </span>
          </>
        )}
        
        {status === 'error' && (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Unable to connect to server</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="ml-2 underline hover:no-underline"
              >
                Try again
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
