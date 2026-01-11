import { useState, useEffect, useRef } from "react";
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
import { useStyleGlobalChangeDetection } from "@/hooks/useGlobalChangeDetection";
import { GlobalChangeWarning } from "./GlobalChangeWarning";
import { GlobalChangeConfirmModal } from "./GlobalChangeConfirmModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Loader2 } from "lucide-react";

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
  const [isUploading, setIsUploading] = useState(false);
  const [showGlobalConfirm, setShowGlobalConfirm] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: organizations } = useOrganizations();
  const createStyle = useCreateStyle();
  const updateStyle = useUpdateStyle();

  const isEditing = !!style;

  // Detect global change impact
  const globalChangeInfo = useStyleGlobalChangeDetection(
    {
      organizationId,
      isDefault,
      name,
      promptModifier,
      status,
    },
    style || null,
    isEditing
  );
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

    // Check if this is a global change and show confirmation
    if (globalChangeInfo.isGlobalChange) {
      setShowGlobalConfirm(true);
      return;
    }

    await performSave();
  };

  const performSave = async () => {
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

    setShowGlobalConfirm(false);
    onOpenChange(false);
  } catch (error) {
    toast.error(isEditing ? "Failed to update style" : "Failed to create style");
    setShowGlobalConfirm(false);
  }
};

const handleGlobalConfirm = async () => {
  await performSave();
};

  const isPending = createStyle.isPending || updateStyle.isPending;

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `style-thumbnails/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("generated-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("generated-images")
        .getPublicUrl(fileName);

      setThumbnailUrl(publicUrl);
      toast.success("Thumbnail uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload thumbnail");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailUrl("");
  };

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
            <Label>Thumbnail (optional)</Label>
            <div className="flex items-start gap-3">
              {thumbnailUrl ? (
                <div className="relative group">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail preview"
                    className="w-24 h-24 object-cover rounded-lg border border-border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span className="text-xs">Upload</span>
                    </>
                  )}
                </button>
              )}
              <div className="flex-1 space-y-2">
                <Input
                  id="thumbnail-url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="Or paste image URL"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Upload an image or paste a URL
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailUpload}
              className="hidden"
            />
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

          {/* Global Change Warning */}
          <GlobalChangeWarning changeInfo={globalChangeInfo} />

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

      {/* Global Change Confirmation Modal */}
      <GlobalChangeConfirmModal
        open={showGlobalConfirm}
        onOpenChange={setShowGlobalConfirm}
        onConfirm={handleGlobalConfirm}
        isPending={isPending}
      />
    </Dialog>
  );
}
