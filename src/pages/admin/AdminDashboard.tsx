import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to the Stax admin panel
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border/50 bg-card p-6">
            <p className="text-sm text-muted-foreground">Dashboard content coming soon...</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
