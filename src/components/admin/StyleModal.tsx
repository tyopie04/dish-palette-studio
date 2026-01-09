import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateStyle, useUpdateStyle, Style } from "@/hooks/useStyles";
import { useOrganizations } from "@/hooks/useOrganizations";
import { toast } from "sonner";

interface StyleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  style?: Style | null;
}

export function StyleModal({ open, onOpenChange, style }: StyleModalProps) {
  const [name, setName] = useState("");
  const [promptModifier, setPromptModifier] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [organizationId, setOrganizationId] = useState<string>("global");
  const [hasColorPicker, setHasColorPicker] = useState(false);

  const { data: organizations } = useOrganizations();
  const createStyle = useCreateStyle();
  const updateStyle = useUpdateStyle();

  const isEditing = !!style;

  useEffect(() => {
    if (style) {
      setName(style.name);
      setPromptModifier(style.prompt_modifier);
      setThumbnailUrl(style.thumbnail_url || "");
      setOrganizationId(style.organization_id || "global");
      setHasColorPicker(style.has_color_picker);
    } else {
      resetForm();
    }
  }, [style, open]);

  const resetForm = () => {
    setName("");
    setPromptModifier("");
    setThumbnailUrl("");
    setOrganizationId("global");
    setHasColorPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Style name is required");
      return;
    }

    if (!promptModifier.trim()) {
      toast.error("Prompt modifier is required");
      return;
    }

    try {
      const orgId = organizationId === "global" ? null : organizationId;

      if (isEditing && style) {
        await updateStyle.mutateAsync({
          id: style.id,
          name: name.trim(),
          prompt_modifier: promptModifier.trim(),
          thumbnail_url: thumbnailUrl.trim() || undefined,
          organization_id: orgId,
          has_color_picker: hasColorPicker,
        });
        toast.success("Style updated successfully");
      } else {
        await createStyle.mutateAsync({
          name: name.trim(),
          prompt_modifier: promptModifier.trim(),
          thumbnail_url: thumbnailUrl.trim() || undefined,
          organization_id: orgId,
          has_color_picker: hasColorPicker,
        });
        toast.success("Style created successfully");
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(isEditing ? "Failed to update style" : "Failed to create style");
    }
  };

  const isPending = createStyle.isPending || updateStyle.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Style" : "Add New Style"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="style-name">Name</Label>
            <Input
              id="style-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Rustic Wood"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt-modifier">Prompt Modifier</Label>
            <Textarea
              id="prompt-modifier"
              value={promptModifier}
              onChange={(e) => setPromptModifier(e.target.value)}
              placeholder="e.g., on rustic wooden table, natural lighting, warm tones"
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              This text will be appended to generation prompts when this style is selected
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail-url">Thumbnail URL (optional)</Label>
            <Input
              id="thumbnail-url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://example.com/thumbnail.jpg"
            />
            {thumbnailUrl && (
              <div className="mt-2">
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail preview"
                  className="w-20 h-20 object-cover rounded border border-border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Select value={organizationId} onValueChange={setOrganizationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global (all organizations)</SelectItem>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="color-picker">Has Color Picker</Label>
              <p className="text-xs text-muted-foreground">
                Allow users to pick a custom color for this style
              </p>
            </div>
            <Switch
              id="color-picker"
              checked={hasColorPicker}
              onCheckedChange={setHasColorPicker}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Style"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
