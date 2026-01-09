import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminTrash() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trash</h1>
          <p className="text-muted-foreground mt-1">
            View and restore deleted items
          </p>
        </div>
        
        <div className="rounded-lg border border-border/50 bg-card p-6">
          <p className="text-sm text-muted-foreground">Trash management coming soon...</p>
        </div>
      </div>
    </AdminLayout>
  );
}
