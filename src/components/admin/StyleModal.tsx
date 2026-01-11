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

const CATEGORY_OPTIONS = [
  "Studio",
  "UGC",
  "Lifestyle",
  "Minimal",
  "Seasonal",
  "Editorial",
  "Other",
];

interface StyleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  style?: Style | null;
}

export function StyleModal({ open, onOpenChange, style }: StyleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [promptModifier, setPromptModifier] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [organizationId, setOrganizationId] = useState<string>("global");
  const [category, setCategory] = useState("Studio");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [isDefault, setIsDefault] = useState(false);
  const [hasColorPicker, setHasColorPicker] = useState(false);

  const { data: organizations } = useOrganizations();
  const createStyle = useCreateStyle();
  const updateStyle = useUpdateStyle();

  const isEditing = !!style;

  useEffect(() => {
    if (style) {
      setName(style.name);
      setDescription(style.description || "");
      setPromptModifier(style.prompt_modifier);
      setThumbnailUrl(style.thumbnail_url || "");
      setOrganizationId(style.organization_id || "global");
      setCategory(style.category || "Studio");
      setStatus(style.status || "active");
      setIsDefault(style.is_default || false);
      setHasColorPicker(style.has_color_picker);
    } else {
      resetForm();
    }
  }, [style, open]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPromptModifier("");
    setThumbnailUrl("");
    setOrganizationId("global");
    setCategory("Studio");
    setStatus("active");
    setIsDefault(false);
    setHasColorPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Style name is required");
      return;
    }

    if (!promptModifier.trim()) {
      toast.error("Prompt snippet is required");
      return;
    }

    try {
      const orgId = organizationId === "global" ? null : organizationId;

      if (isEditing && style) {
        await updateStyle.mutateAsync({
          id: style.id,
          name: name.trim(),
          description: description.trim() || undefined,
          prompt_modifier: promptModifier.trim(),
          thumbnail_url: thumbnailUrl.trim() || undefined,
          organization_id: orgId,
          category,
          status,
          is_default: isDefault,
          has_color_picker: hasColorPicker,
        });
        toast.success("Style updated successfully");
      } else {
        await createStyle.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          prompt_modifier: promptModifier.trim(),
          thumbnail_url: thumbnailUrl.trim() || undefined,
          organization_id: orgId,
          category,
          status,
          is_default: isDefault,
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
              placeholder="e.g., Clean Studio, UGC iPhone, Premium Editorial"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short explanation shown to users"
            />
            <p className="text-xs text-muted-foreground">
              This description helps users understand when to use this style
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt-modifier">Prompt Snippet</Label>
            <Textarea
              id="prompt-modifier"
              value={promptModifier}
              onChange={(e) => setPromptModifier(e.target.value)}
              placeholder="e.g., on rustic wooden table, natural lighting, warm tones"
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              This text will be injected into image generation prompts when this style is selected
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

          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="status">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive styles won't appear in user-facing selectors
                </p>
              </div>
              <Switch
                id="status"
                checked={status === "active"}
                onCheckedChange={(checked) => setStatus(checked ? "active" : "inactive")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is-default">Default Style</Label>
                <p className="text-xs text-muted-foreground">
                  Pre-select this style for new generations
                </p>
              </div>
              <Switch
                id="is-default"
                checked={isDefault}
                onCheckedChange={setIsDefault}
              />
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
