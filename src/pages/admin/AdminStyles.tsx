import { useState } from "react";
import { Plus, Edit, Trash2, Palette, Globe, Star, EyeOff, Tag, AlertTriangle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StyleModal } from "@/components/admin/StyleModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStyles, useDeleteStyle, useUpdateStyle, Style } from "@/hooks/useStyles";
import { useOrganizations } from "@/hooks/useOrganizations";
import { detectStyleChangeImpact } from "@/hooks/useGlobalChangeDetection";
import { toast } from "sonner";

export default function AdminStyles() {
  const [filterOrgId, setFilterOrgId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: styles, isLoading } = useStyles(filterOrgId);
  const { data: organizations } = useOrganizations();
  const deleteStyle = useDeleteStyle();
  const updateStyle = useUpdateStyle();

  // Apply client-side filtering for status and category
  const filteredStyles = styles?.filter((style) => {
    if (filterStatus !== "all" && style.status !== filterStatus) return false;
    if (filterCategory !== "all" && style.category !== filterCategory) return false;
    return true;
  });

  // Get unique categories from styles
  const categories = [...new Set(styles?.map((s) => s.category) || [])];

  const handleEdit = (style: Style) => {
    setEditingStyle(style);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingStyle(null);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await deleteStyle.mutateAsync(deleteConfirmId);
      toast.success("Style deleted");
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error("Failed to delete style");
    }
  };

  // Get the style being deleted to check if it's global
  const styleToDelete = styles?.find(s => s.id === deleteConfirmId);
  const deleteChangeInfo = styleToDelete 
    ? detectStyleChangeImpact(null, 'delete', styleToDelete)
    : null;

  const handleToggleStatus = async (style: Style) => {
    try {
      await updateStyle.mutateAsync({
        id: style.id,
        status: style.status === "active" ? "inactive" : "active",
      });
      toast.success(
        style.status === "active" ? "Style deactivated" : "Style activated"
      );
    } catch (error) {
      toast.error("Failed to update style status");
    }
  };

  const handleToggleDefault = async (style: Style) => {
    try {
      await updateStyle.mutateAsync({
        id: style.id,
        is_default: !style.is_default,
      });
      toast.success(
        style.is_default ? "Removed as default" : "Marked as default"
      );
    } catch (error) {
      toast.error("Failed to update default status");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Styles</h1>
            <p className="text-muted-foreground mt-1">
              Manage image generation styles. Changes apply immediately to all users.
            </p>
          </div>

          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Style
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filterOrgId} onValueChange={setFilterOrgId}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orgs</SelectItem>
              <SelectItem value="global">Global Only</SelectItem>
              {organizations?.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Styles Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/50 bg-card p-4 animate-pulse"
              >
                <div className="aspect-video bg-muted rounded-md mb-3" />
                <div className="h-5 w-2/3 bg-muted rounded mb-2" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filteredStyles?.length === 0 ? (
          <div className="rounded-lg border border-border/50 bg-card p-12 text-center">
            <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">
              {styles?.length === 0 ? "No styles yet" : "No styles match filters"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {styles?.length === 0
                ? "Create your first style preset to get started"
                : "Try adjusting your filter criteria"}
            </p>
            {styles?.length === 0 && (
              <Button onClick={handleAddNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Style
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredStyles?.map((style) => (
              <div
                key={style.id}
                className={`rounded-lg border bg-card overflow-hidden group transition-all ${
                  style.status === "inactive"
                    ? "border-border/30 opacity-60"
                    : "border-border/50 hover:border-primary/50"
                }`}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-muted relative">
                  {style.thumbnail_url ? (
                    <img
                      src={style.thumbnail_url}
                      alt={style.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Palette className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* Status badges */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {style.is_default && (
                      <Badge variant="default" className="gap-1 text-xs">
                        <Star className="w-3 h-3" />
                        Default
                      </Badge>
                    )}
                    {style.status === "inactive" && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <EyeOff className="w-3 h-3" />
                        Inactive
                      </Badge>
                    )}
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(style)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleToggleStatus(style)}
                      title={style.status === "active" ? "Deactivate" : "Activate"}
                    >
                      <EyeOff className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleToggleDefault(style)}
                      title={style.is_default ? "Remove default" : "Set as default"}
                    >
                      <Star className={`h-4 w-4 ${style.is_default ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteConfirmId(style.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground truncate">{style.name}</h3>
                    {style.has_color_picker && (
                      <div
                        className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 flex-shrink-0"
                        title="Has color picker"
                      />
                    )}
                  </div>

                  {style.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {style.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Tag className="w-3 h-3" />
                      {style.category}
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="w-3 h-3" />
                      {style.organization_name ?? "Global"}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 pt-1 border-t border-border/50">
                    {style.prompt_modifier}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <StyleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        style={editingStyle}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {deleteChangeInfo?.isGlobalChange && (
                <AlertTriangle className="w-5 h-5 text-destructive" />
              )}
              Delete this style?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span>
                This action cannot be undone. The style will be permanently removed and will no longer be available to users.
              </span>
              {deleteChangeInfo?.isGlobalChange && (
                <span className="block p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <strong>Global Impact:</strong> {deleteChangeInfo.warningMessage}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteChangeInfo?.isGlobalChange ? 'Delete Global Style' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
