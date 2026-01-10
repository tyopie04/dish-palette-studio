import { useState } from "react";
import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

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
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Lightspeed_Commerce_logo.svg/200px-Lightspeed_Commerce_logo.svg.png",
  },
  {
    id: "square",
    name: "Square",
    description: "Connect your Square POS to sync menu items and sales data.",
    status: "not_connected",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Square%2C_Inc._-_Square_logo.svg/200px-Square%2C_Inc._-_Square_logo.svg.png",
  },
];

export default function SettingsIntegrations() {
  const [connections, setConnections] = useState<POSConnection[]>(initialConnections);

  const getStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Connected</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Not connected</Badge>;
    }
  };

  const handleConnect = (id: string) => {
    // Simulate connection - in real implementation, this would trigger OAuth flow
    setConnections((prev) =>
      prev.map((conn) =>
        conn.id === id
          ? {
              ...conn,
              status: "connected" as ConnectionStatus,
              accountName: id === "lightspeed" ? "Stax Burger Co." : "Stax Square Account",
              locationCount: 3,
              lastSynced: new Date().toLocaleString(),
            }
          : conn
      )
    );
  };

  const handleDisconnect = (id: string) => {
    setConnections((prev) =>
      prev.map((conn) =>
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
    <SettingsLayout>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">POS Connections</h1>
          <p className="text-muted-foreground mt-1">
            Connect your point-of-sale system to sync menu items and sales data.
          </p>
        </div>

        <div className="space-y-4">
          {connections.map((connection) => (
            <Card key={connection.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-white p-2 flex items-center justify-center border border-border">
                    <img
                      src={connection.logo}
                      alt={`${connection.name} logo`}
                      className="h-8 w-auto object-contain"
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{connection.name}</CardTitle>
                    <CardDescription className="mt-1">{connection.description}</CardDescription>
                  </div>
                </div>
                {getStatusBadge(connection.status)}
              </CardHeader>
              <CardContent>
                {connection.status === "connected" && (
                  <div className="mb-4 text-sm text-muted-foreground space-y-1">
                    {connection.accountName && <p>Account: {connection.accountName}</p>}
                    {connection.locationCount !== undefined && (
                      <p>Locations connected: {connection.locationCount}</p>
                    )}
                    {connection.lastSynced && <p>Last synced: {connection.lastSynced}</p>}
                  </div>
                )}
                <div className="flex gap-2">
                  {connection.status === "not_connected" && (
                    <Button onClick={() => handleConnect(connection.id)}>Connect</Button>
                  )}
                  {connection.status === "connected" && (
                    <>
                      <Button variant="outline" onClick={() => handleDisconnect(connection.id)}>
                        Disconnect
                      </Button>
                    </>
                  )}
                  {connection.status === "error" && (
                    <Button onClick={() => handleConnect(connection.id)}>Reconnect</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Read-only access. You can disconnect anytime.</span>
        </div>
      </div>
    </SettingsLayout>
  );
}
