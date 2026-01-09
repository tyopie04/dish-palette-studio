import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { RotateCcw, Trash2, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
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
import { useTrash, TrashItem } from "@/hooks/useTrash";
import { useOrganizations } from "@/hooks/useOrganizations";
import { toast } from "sonner";

export default function AdminTrash() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const { data: organizations } = useOrganizations();
  const { trashItems, loading, restorePhoto, permanentlyDeletePhoto } = useTrash(
    selectedOrgId === "all" ? undefined : selectedOrgId
  );

  const handleRestore = async (item: TrashItem) => {
    try {
      await restorePhoto.mutateAsync(item.id);
      toast.success(`"${item.name}" restored successfully`);
    } catch (error) {
      toast.error("Failed to restore photo");
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteConfirmId) return;
    
    try {
      await permanentlyDeletePhoto.mutateAsync(deleteConfirmId);
      toast.success("Photo permanently deleted");
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error("Failed to delete photo");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trash</h1>
            <p className="text-muted-foreground mt-1">
              Recover or permanently delete photos
            </p>
          </div>

          <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {organizations?.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Warning banner */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-200">
            Items are permanently deleted after 30 days. Restore items to keep them.
          </p>
        </div>

        {/* Trash table */}
        <div className="rounded-lg border border-border/50 bg-card overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/20 animate-pulse"
                >
                  <div className="w-12 h-12 rounded bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-muted rounded" />
                    <div className="h-3 w-1/4 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : trashItems.length === 0 ? (
            <div className="p-12 text-center">
              <Trash2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">Trash is empty</h3>
              <p className="text-sm text-muted-foreground">
                Deleted photos will appear here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                      Photo
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                      Organization
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                      Deleted
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                      Deleted By
                    </th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trashItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/30 hover:bg-muted/30"
                    >
                      {/* Thumbnail & Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            {item.thumbnail_url ? (
                              <img
                                src={item.thumbnail_url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-foreground truncate max-w-[200px]">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* Organization */}
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {item.organization_name ?? "No organization"}
                        </span>
                      </td>

                      {/* Deleted Date */}
                      <td className="p-4 hidden lg:table-cell">
                        <div>
                          <p className="text-sm text-foreground">
                            {formatDistanceToNow(new Date(item.deleted_at), { addSuffix: true })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.deleted_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </td>

                      {/* Deleted By */}
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {item.deleted_by_email ?? "Unknown"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(item)}
                            disabled={restorePhoto.isPending}
                            className="gap-1"
                          >
                            <RotateCcw className="h-4 w-4" />
                            <span className="hidden sm:inline">Restore</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteConfirmId(item.id)}
                            disabled={permanentlyDeletePhoto.isPending}
                            className="gap-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete Forever</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Permanent delete confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The photo and all its data will be
              permanently removed from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
