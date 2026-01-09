import { useState, useEffect } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientsTable } from "@/components/admin/ClientsTable";
import { AddClientModal } from "@/components/admin/AddClientModal";
import { EditClientModal } from "@/components/admin/EditClientModal";
import { ClientDetailPanel } from "@/components/admin/ClientDetailPanel";
import { Button } from "@/components/ui/button";
import { useOrganizations, Organization } from "@/hooks/useOrganizations";

export default function AdminClients() {
  const { data: organizations, isLoading, error, refetch } = useOrganizations();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [detailOrgId, setDetailOrgId] = useState<string | null>(null);

  useEffect(() => {
    console.log("[AdminClients] Component mounted");
    console.log("[AdminClients] isLoading:", isLoading);
    console.log("[AdminClients] organizations:", organizations);
    console.log("[AdminClients] error:", error);
  }, [isLoading, organizations, error]);

  const handleEdit = (org: Organization) => {
    setSelectedOrg(org);
    setEditModalOpen(true);
  };

  const handleRowClick = (org: Organization) => {
    setDetailOrgId(org.id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground mt-1">
              Manage client organizations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => {
                console.log("[AdminClients] Manual refetch triggered");
                refetch();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setAddModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Client
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
          <ClientsTable
            organizations={organizations ?? []}
            loading={isLoading}
            onEdit={handleEdit}
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      <AddClientModal open={addModalOpen} onOpenChange={setAddModalOpen} />
      
      <EditClientModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        organization={selectedOrg}
      />

      <ClientDetailPanel
        organizationId={detailOrgId}
        onClose={() => setDetailOrgId(null)}
      />
    </AdminLayout>
  );
}
