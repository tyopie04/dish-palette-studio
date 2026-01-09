import { format, formatDistanceToNow } from "date-fns";
import { Edit, LogIn, Ban, MoreHorizontal, Building2 } from "lucide-react";
import { Organization, useUpdateOrganization } from "@/hooks/useOrganizations";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ClientsTableProps {
  organizations: Organization[];
  loading?: boolean;
  onEdit: (org: Organization) => void;
  onRowClick: (org: Organization) => void;
}

export function ClientsTable({
  organizations,
  loading,
  onEdit,
  onRowClick,
}: ClientsTableProps) {
  const updateOrg = useUpdateOrganization();

  const handleLoginAs = (org: Organization) => {
    // Store in localStorage for "Login As" functionality
    localStorage.setItem("admin_override_org", JSON.stringify({
      id: org.id,
      name: org.name,
      slug: org.slug,
    }));
    toast.success(`Now viewing as ${org.name}. Refresh the main app to see changes.`);
  };

  const handleToggleDisable = async (org: Organization) => {
    try {
      await updateOrg.mutateAsync({
        id: org.id,
        disabled: !org.disabled,
      });
      toast.success(org.disabled ? "Client enabled" : "Client disabled");
    } catch (error) {
      toast.error("Failed to update client status");
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-lg bg-muted/20 animate-pulse"
          >
            <div className="w-10 h-10 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-muted rounded" />
              <div className="h-3 w-1/4 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="p-12 text-center">
        <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-1">No clients yet</h3>
        <p className="text-sm text-muted-foreground">
          Add your first client to get started
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">
              Client
            </th>
            <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
              Owner
            </th>
            <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
              Created
            </th>
            <th className="text-center p-4 text-sm font-medium text-muted-foreground">
              Generations
            </th>
            <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
              Last Active
            </th>
            <th className="text-right p-4 text-sm font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((org) => (
            <tr
              key={org.id}
              className={`border-b border-border/30 hover:bg-muted/30 cursor-pointer transition-colors ${
                org.disabled ? "opacity-50" : ""
              }`}
              onClick={() => onRowClick(org)}
            >
              {/* Logo & Name */}
              <td className="p-4">
                <div className="flex items-center gap-3">
                  {org.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="w-10 h-10 rounded-lg object-contain border border-border"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: org.primary_color || "#ff6b35" }}
                    >
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground">{org.name}</p>
                    <p className="text-xs text-muted-foreground">/{org.slug}</p>
                  </div>
                  {org.disabled && (
                    <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                      Disabled
                    </span>
                  )}
                </div>
              </td>

              {/* Owner Email */}
              <td className="p-4 hidden md:table-cell">
                <span className="text-sm text-muted-foreground">
                  {org.owner_email ?? "No owner"}
                </span>
              </td>

              {/* Created Date */}
              <td className="p-4 hidden lg:table-cell">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(org.created_at), "MMM d, yyyy")}
                </span>
              </td>

              {/* Generations Count */}
              <td className="p-4 text-center">
                <span className="text-sm font-medium text-foreground">
                  {org.generations_count ?? 0}
                </span>
              </td>

              {/* Last Active */}
              <td className="p-4 hidden lg:table-cell">
                <span className="text-sm text-muted-foreground">
                  {org.last_active
                    ? formatDistanceToNow(new Date(org.last_active), { addSuffix: true })
                    : "Never"}
                </span>
              </td>

              {/* Actions */}
              <td className="p-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => onEdit(org)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleLoginAs(org)}>
                      <LogIn className="mr-2 h-4 w-4" />
                      Login As
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggleDisable(org)}
                      className={org.disabled ? "text-green-500" : "text-destructive"}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      {org.disabled ? "Enable" : "Disable"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
