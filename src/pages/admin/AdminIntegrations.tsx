import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ExternalLink } from "lucide-react";

type ConnectionStatus = "not_connected" | "connected" | "error";

interface POSConnection {
  id: string;
  name: string;
  description: string;
  status: ConnectionStatus;
  accountName?: string;
  locationCount?: number;
  lastSynced?: string;
  logo: string;
}

const initialConnections: POSConnection[] = [
  {
    id: "lightspeed",
    name: "Lightspeed (O Series / Kounta)",
    description: "Connect your Lightspeed POS to sync menu items and sales data.",
    status: "not_connected",
    logo: "https://cdn.brandfetch.io/idWz_b2JTq/w/400/h/400/theme/dark/icon.png?c=1dxbfHSJFAPEGdCLU4o5B",
  },
  {
    id: "square",
    name: "Square",
    description: "Connect your Square POS to sync menu items and transaction data.",
    status: "not_connected",
    logo: "https://cdn.brandfetch.io/idVfYwcuQz/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B",
  },
];

export default function AdminIntegrations() {
  const [connections, setConnections] = useState<POSConnection[]>(initialConnections);

  const getStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">Connected</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Not connected</Badge>;
    }
  };

  const handleConnect = (id: string) => {
    // Simulate connection - in real app this would open OAuth flow
    setConnections(prev =>
      prev.map(conn =>
        conn.id === id
          ? {
              ...conn,
              status: "connected" as ConnectionStatus,
              accountName: id === "lightspeed" ? "Demo Restaurant" : "Square Merchant",
              locationCount: id === "lightspeed" ? 2 : 1,
              lastSynced: new Date().toLocaleString(),
            }
          : conn
      )
    );
  };

  const handleDisconnect = (id: string) => {
    setConnections(prev =>
      prev.map(conn =>
        conn.id === id
          ? {
              ...conn,
              status: "not_connected" as ConnectionStatus,
              accountName: undefined,
              locationCount: undefined,
              lastSynced: undefined,
            }
          : conn
      )
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">POS Connections</h1>
          <p className="text-muted-foreground mt-1">
            Connect your point-of-sale system to sync menu items and sales data.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {connections.map((connection) => (
            <Card key={connection.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      <img
                        src={connection.logo}
                        alt={connection.name}
                        className="h-10 w-10 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{connection.name}</CardTitle>
                      <CardDescription className="mt-0.5">
                        {connection.description}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(connection.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {connection.status === "connected" && (
                  <div className="text-sm text-muted-foreground space-y-1 bg-muted/50 rounded-md p-3">
                    {connection.accountName && (
                      <p>
                        <span className="font-medium text-foreground">Account:</span>{" "}
                        {connection.accountName}
                      </p>
                    )}
                    {connection.locationCount !== undefined && (
                      <p>
                        <span className="font-medium text-foreground">Locations:</span>{" "}
                        {connection.locationCount} connected
                      </p>
                    )}
                    {connection.lastSynced && (
                      <p>
                        <span className="font-medium text-foreground">Last synced:</span>{" "}
                        {connection.lastSynced}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {connection.status === "not_connected" && (
                    <Button onClick={() => handleConnect(connection.id)} className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Connect
                    </Button>
                  )}
                  {connection.status === "connected" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleDisconnect(connection.id)}
                      >
                        Disconnect
                      </Button>
                    </>
                  )}
                  {connection.status === "error" && (
                    <Button
                      variant="destructive"
                      onClick={() => handleConnect(connection.id)}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Reconnect
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
          <Shield className="h-4 w-4 shrink-0" />
          <p>Read-only access. You can disconnect anytime.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
