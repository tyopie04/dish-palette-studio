import { useState } from "react";
import { Plus } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ClientsTable } from "@/components/admin/ClientsTable";
import { AddClientModal } from "@/components/admin/AddClientModal";
import { EditClientModal } from "@/components/admin/EditClientModal";
import { ClientDetailPanel } from "@/components/admin/ClientDetailPanel";
import { Button } from "@/components/ui/button";
import { useOrganizations, Organization } from "@/hooks/useOrganizations";

export default function AdminClients() {
  const { data: organizations, isLoading } = useOrganizations();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [detailOrgId, setDetailOrgId] = useState<string | null>(null);

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
          <Button onClick={() => setAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Client
          </Button>
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
