import { useState, useEffect } from 'react';
import { AlertTriangle, Globe } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface GlobalChangeSummary {
  itemName?: string;
  itemType?: string;
  fieldsChanged?: string[];
  scope: 'all_clients';
}

interface GlobalChangeConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
  summary?: GlobalChangeSummary;
}

export function GlobalChangeConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
  summary,
}: GlobalChangeConfirmModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  // Reset acknowledgement when modal opens/closes
  useEffect(() => {
    if (!open) {
      setAcknowledged(false);
    }
  }, [open]);

  const canConfirm = acknowledged && !isPending;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="border-destructive/50 bg-destructive/5 max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-destructive/20">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl text-destructive">
              This change affects all clients
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base text-foreground/80">
            You are about to make a change that will immediately affect all client apps. Are you sure you want to make this change?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Change Summary */}
        {summary && (
          <div className="my-4 p-3 rounded-lg bg-muted/50 border border-border space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Change Summary
            </p>
            {summary.itemType && summary.itemName && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">{summary.itemType}:</span>
                <span className="font-medium text-foreground">{summary.itemName}</span>
              </div>
            )}
            {summary.fieldsChanged && summary.fieldsChanged.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground">
                  {summary.fieldsChanged.length === 1 ? 'Field changed:' : 'Fields changed:'}
                </span>
                <span className="font-medium text-foreground">
                  {summary.fieldsChanged.join(', ')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Scope:</span>
              <span className="font-medium text-destructive flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                All clients
              </span>
            </div>
          </div>
        )}

        {/* Acknowledgement Checkbox */}
        <div className="flex items-start gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <Checkbox
            id="acknowledge-global-change"
            checked={acknowledged}
            onCheckedChange={(checked) => setAcknowledged(checked === true)}
            className="mt-0.5 border-destructive data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
          />
          <Label
            htmlFor="acknowledge-global-change"
            className="text-sm text-foreground cursor-pointer leading-relaxed"
          >
            I understand this will affect all clients.
          </Label>
        </div>

        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (canConfirm) {
                onConfirm();
              }
            }}
            disabled={!canConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving...' : 'Confirm global change'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
