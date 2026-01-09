import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateOrganization, Organization } from "@/hooks/useOrganizations";
import { toast } from "sonner";

interface EditClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
}

export function EditClientModal({ open, onOpenChange, organization }: EditClientModalProps) {
  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#ff6b35");
  const [logoUrl, setLogoUrl] = useState("");

  const updateOrg = useUpdateOrganization();

  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setPrimaryColor(organization.primary_color || "#ff6b35");
      setLogoUrl(organization.logo_url || "");
    }
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organization) return;

    if (!name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    try {
      await updateOrg.mutateAsync({
        id: organization.id,
        name: name.trim(),
        primary_color: primaryColor,
        logo_url: logoUrl.trim() || undefined,
      });

      toast.success("Client updated successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update client");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Organization Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Restaurant"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="edit-color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                placeholder="#ff6b35"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-logo">Logo URL</Label>
            <Input
              id="edit-logo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
            {logoUrl && (
              <div className="mt-2">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="w-16 h-16 object-contain rounded border border-border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateOrg.isPending}>
              {updateOrg.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
