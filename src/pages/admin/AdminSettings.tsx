import { useState, useEffect } from "react";
import { Save, Settings as SettingsIcon, Activity, AlertTriangle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminSettings, useUpdateAdminSettings } from "@/hooks/useAdminSettings";
import { useSettingsGlobalChangeDetection } from "@/hooks/useGlobalChangeDetection";
import { GlobalChangeWarning } from "@/components/admin/GlobalChangeWarning";
import { toast } from "sonner";

const RESOLUTIONS = [
  { value: "1K", label: "1K (1024px)" },
  { value: "2K", label: "2K (2048px)" },
  { value: "4K", label: "4K (4096px)" },
];

const RATIOS = [
  { value: "1:1", label: "1:1 (Square)" },
  { value: "4:5", label: "4:5 (Portrait)" },
  { value: "9:16", label: "9:16 (Story)" },
  { value: "16:9", label: "16:9 (Landscape)" },
];

export default function AdminSettings() {
  const { data: settings, isLoading } = useAdminSettings();
  const updateSettings = useUpdateAdminSettings();

  const [masterPrompt, setMasterPrompt] = useState("");
  const [defaultResolution, setDefaultResolution] = useState("1K");
  const [defaultRatio, setDefaultRatio] = useState("1:1");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setMasterPrompt(settings.master_prompt);
      setDefaultResolution(settings.default_resolution);
      setDefaultRatio(settings.default_ratio);
      setHasChanges(false);
    }
  }, [settings]);

  // Detect global changes
  const globalChanges = useSettingsGlobalChangeDetection(
    { masterPrompt, defaultResolution, defaultRatio },
    settings ? {
      masterPrompt: settings.master_prompt,
      defaultResolution: settings.default_resolution,
      defaultRatio: settings.default_ratio,
    } : null
  );

  const hasGlobalChanges = globalChanges.length > 0;
  const hasCriticalChanges = globalChanges.some(c => c.severity === 'critical');

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        master_prompt: masterPrompt,
        default_resolution: defaultResolution,
        default_ratio: defaultRatio,
      });
      toast.success("Settings saved successfully");
      setHasChanges(false);
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setter(value);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">Configure global settings</p>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border border-border/50 bg-card p-6 animate-pulse">
                <div className="h-6 w-1/4 bg-muted rounded mb-4" />
                <div className="h-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure global generation settings
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateSettings.isPending}
            className={`gap-2 ${hasCriticalChanges ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
          >
            {hasCriticalChanges && <AlertTriangle className="h-4 w-4" />}
            <Save className="h-4 w-4" />
            {updateSettings.isPending ? "Saving..." : hasGlobalChanges ? "Save Global Changes" : "Save Changes"}
          </Button>
        </div>

        {/* Global Change Warnings */}
        {hasGlobalChanges && (
          <div className="space-y-2">
            {globalChanges.map((change, i) => (
              <GlobalChangeWarning key={i} changeInfo={change} />
            ))}
          </div>
        )}

        {/* Master Prompt */}
        <div className="rounded-lg border border-border/50 bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <SettingsIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Master Prompt</h2>
              <p className="text-sm text-muted-foreground">
                Base prompt applied to all generations
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="master-prompt">Base Prompt</Label>
            <Textarea
              id="master-prompt"
              value={masterPrompt}
              onChange={(e) => handleChange(setMasterPrompt, e.target.value)}
              placeholder="Enter the master prompt that will be prepended to all generation requests..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              ✓ Connected — This prompt is actively applied to all image generations as the base style directive
            </p>
          </div>
        </div>

        {/* Default Settings */}
        <div className="rounded-lg border border-border/50 bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <SettingsIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Default Generation Settings</h2>
              <p className="text-sm text-muted-foreground">
                Default values for new generations
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="resolution">Default Resolution</Label>
              <Select
                value={defaultResolution}
                onValueChange={(v) => handleChange(setDefaultResolution, v)}
              >
                <SelectTrigger id="resolution">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOLUTIONS.map((res) => (
                    <SelectItem key={res.value} value={res.value}>
                      {res.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ratio">Default Aspect Ratio</Label>
              <Select
                value={defaultRatio}
                onValueChange={(v) => handleChange(setDefaultRatio, v)}
              >
                <SelectTrigger id="ratio">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RATIOS.map((ratio) => (
                    <SelectItem key={ratio.value} value={ratio.value}>
                      {ratio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            ✓ Connected — These defaults are applied to all new client sessions
          </p>
        </div>

        {/* API Usage Placeholder */}
        <div className="rounded-lg border border-border/50 bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">API Usage</h2>
              <p className="text-sm text-muted-foreground">
                Monitor API consumption and costs
              </p>
            </div>
          </div>

          <div className="py-8 text-center">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              API usage analytics coming soon
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Track generation counts, costs, and usage patterns
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
