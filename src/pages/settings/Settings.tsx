import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();

  return (
    <SettingsLayout>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Account</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-foreground">{user?.email || "Not available"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Account ID</label>
              <p className="text-foreground text-sm font-mono">{user?.id || "Not available"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}
