import { useState } from "react";
import { Plus, Edit, Trash2, Palette, Globe } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StyleModal } from "@/components/admin/StyleModal";
import { Button } from "@/components/ui/button";
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
import { useStyles, useDeleteStyle, Style } from "@/hooks/useStyles";
import { useOrganizations } from "@/hooks/useOrganizations";
import { toast } from "sonner";

export default function AdminStyles() {
  const [filterOrgId, setFilterOrgId] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: styles, isLoading } = useStyles(filterOrgId);
  const { data: organizations } = useOrganizations();
  const deleteStyle = useDeleteStyle();

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Styles</h1>
            <p className="text-muted-foreground mt-1">
              Manage prompt style presets
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={filterOrgId} onValueChange={setFilterOrgId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Styles</SelectItem>
                <SelectItem value="global">Global Only</SelectItem>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Style
            </Button>
          </div>
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
        ) : styles?.length === 0 ? (
          <div className="rounded-lg border border-border/50 bg-card p-12 text-center">
            <Palette className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No styles yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first style preset to get started
            </p>
            <Button onClick={handleAddNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Style
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {styles?.map((style) => (
              <div
                key={style.id}
                className="rounded-lg border border-border/50 bg-card overflow-hidden group hover:border-primary/50 transition-colors"
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
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{style.name}</h3>
                    {style.has_color_picker && (
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500" title="Has color picker" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe className="w-3 h-3" />
                    <span>{style.organization_name ?? "Global"}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
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
            <AlertDialogTitle>Delete this style?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The style will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
