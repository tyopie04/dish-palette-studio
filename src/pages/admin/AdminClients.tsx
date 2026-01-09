import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminClients() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage client accounts
          </p>
        </div>
        
        <div className="rounded-lg border border-border/50 bg-card p-6">
          <p className="text-sm text-muted-foreground">Clients management coming soon...</p>
        </div>
      </div>
    </AdminLayout>
  );
}
