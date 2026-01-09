import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientActivitySummary } from "@/hooks/useClientActivitySummary";

export function ClientActivityTable() {
  const navigate = useNavigate();
  const { data: clients, isLoading } = useClientActivitySummary();

  const handleRowClick = (clientId: string) => {
    navigate(`/admin/clients?selected=${clientId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No client activity found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-border/50">
          <TableHead className="text-muted-foreground">Client</TableHead>
          <TableHead className="text-muted-foreground text-center">Generations (7d)</TableHead>
          <TableHead className="text-muted-foreground text-center">Uploads (7d)</TableHead>
          <TableHead className="text-muted-foreground text-right">Last Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow
            key={client.clientId}
            onClick={() => handleRowClick(client.clientId)}
            className="cursor-pointer hover:bg-muted/50 border-border/30 transition-colors"
          >
            <TableCell>
              <div className="space-y-0.5">
                <div className="font-medium text-foreground">{client.clientName}</div>
                {client.organizationName && (
                  <div className="text-xs text-muted-foreground">{client.organizationName}</div>
                )}
              </div>
            </TableCell>
            <TableCell className="text-center">
              <span className={client.generationsLast7Days > 0 ? "text-foreground" : "text-muted-foreground"}>
                {client.generationsLast7Days}
              </span>
            </TableCell>
            <TableCell className="text-center">
              <span className={client.uploadsLast7Days > 0 ? "text-foreground" : "text-muted-foreground"}>
                {client.uploadsLast7Days}
              </span>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {client.lastActive
                ? formatDistanceToNow(new Date(client.lastActive), { addSuffix: true })
                : "Never"
              }
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
