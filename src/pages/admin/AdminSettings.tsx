import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminSettings() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure admin settings
          </p>
        </div>
        
        <div className="rounded-lg border border-border/50 bg-card p-6">
          <p className="text-sm text-muted-foreground">Settings coming soon...</p>
        </div>
      </div>
    </AdminLayout>
  );
}
