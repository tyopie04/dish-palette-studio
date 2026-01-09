import { AlertTriangle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAdminAlerts } from "@/hooks/useAdminAlerts";
import { Skeleton } from "@/components/ui/skeleton";

export function AlertsSection() {
  const { data: alerts, isLoading } = useAdminAlerts();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const hasIssues = (alerts?.failedGenerationsToday ?? 0) > 0 || (alerts?.inactiveClients ?? 0) > 0;

  if (!hasIssues) {
    return (
      <Alert className="border-green-500/30 bg-green-500/10">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertDescription className="text-green-400">
          ✅ All systems running normally
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {alerts?.failedGenerationsToday > 0 && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {alerts.failedGenerationsToday} failed generation{alerts.failedGenerationsToday !== 1 ? 's' : ''} today
          </AlertDescription>
        </Alert>
      )}
      {alerts?.inactiveClients > 0 && (
        <Alert className="border-yellow-500/30 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-400">
            {alerts.inactiveClients} client{alerts.inactiveClients !== 1 ? 's' : ''} inactive for 7+ days
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
