import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Wand2, Loader2 } from "lucide-react";

interface ImageEditDialogProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (image: string, editPrompt: string) => Promise<void>;
}

export function ImageEditDialog({ image, isOpen, onClose, onEdit }: ImageEditDialogProps) {
  const [editPrompt, setEditPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = async () => {
    if (!editPrompt.trim()) return;
    setIsEditing(true);
    try {
      await onEdit(image, editPrompt);
      setEditPrompt("");
      onClose();
    } finally {
      setIsEditing(false);
    }
  };

  const quickEdits = [
    "Make it brighter",
    "Add steam rising",
    "More dramatic lighting",
    "Add a blurred background",
    "Make colors more vibrant",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            Edit Image with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="rounded-lg overflow-hidden border border-border">
            <img
              src={image}
              alt="Image to edit"
              className="w-full h-48 object-contain bg-muted"
            />
          </div>

          {/* Quick edits */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Quick edits</label>
            <div className="flex flex-wrap gap-2">
              {quickEdits.map((edit) => (
                <button
                  key={edit}
                  onClick={() => setEditPrompt(edit)}
                  className="px-3 py-1.5 text-xs rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                >
                  {edit}
                </button>
              ))}
            </div>
          </div>

          {/* Custom prompt */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Describe your edit
            </label>
            <Textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g., Add a rustic wooden table background..."
              className="h-20 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isEditing}>
              Cancel
            </Button>
            <Button
              variant="glow"
              onClick={handleEdit}
              disabled={!editPrompt.trim() || isEditing}
            >
              {isEditing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Editing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Apply Edit
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
