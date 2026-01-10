import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface EmailFormProps {
  onClose: () => void;
}

const menuItemOptions = ["Burgers", "Pizza", "Salads", "Drinks", "Desserts", "Appetizers", "Sides"];

export function EmailForm({ onClose }: EmailFormProps) {
  const [campaignName, setCampaignName] = useState("");
  const [emailType, setEmailType] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
  const [toneStyle, setToneStyle] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const toggleMenuItem = (item: string) => {
    setSelectedMenuItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting email:", {
      campaignName,
      emailType,
      targetAudience,
      subject,
      selectedMenuItems,
      toneStyle,
      specialInstructions,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">One-Click Email</h3>
        <Button type="button" variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="campaignName">Campaign Name</Label>
          <Input
            id="campaignName"
            placeholder="e.g., Weekly Newsletter"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
          />
        </div>

        <div>
          <Label>Email Type</Label>
          <Select value={emailType} onValueChange={setEmailType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="newsletter">Newsletter</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
              <SelectItem value="welcome">Welcome Email</SelectItem>
              <SelectItem value="re-engagement">Re-engagement</SelectItem>
              <SelectItem value="loyalty">Loyalty Reward</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Target Audience</Label>
          <Select value={targetAudience} onValueChange={setTargetAudience}>
            <SelectTrigger>
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="all">All Subscribers</SelectItem>
              <SelectItem value="new">New Subscribers</SelectItem>
              <SelectItem value="loyal">Loyal Customers</SelectItem>
              <SelectItem value="inactive">Inactive Subscribers</SelectItem>
              <SelectItem value="birthday">Birthday Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="subject">Email Subject Line</Label>
          <Input
            id="subject"
            placeholder="e.g., 🍔 This Week's Special Just Dropped!"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div>
          <Label>Menu Items to Feature</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                {selectedMenuItems.length > 0
                  ? `${selectedMenuItems.length} selected`
                  : "Select items"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-2 bg-popover border border-border z-50">
              <div className="space-y-1">
                {menuItemOptions.map((item) => (
                  <div
                    key={item}
                    className={cn(
                      "px-3 py-2 rounded-md cursor-pointer transition-colors",
                      selectedMenuItems.includes(item)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                    onClick={() => toggleMenuItem(item)}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          {selectedMenuItems.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedMenuItems.map((item) => (
                <Badge key={item} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label>Tone/Style</Label>
          <Select value={toneStyle} onValueChange={setToneStyle}>
            <SelectTrigger>
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="friendly">Friendly & Warm</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="exciting">Exciting & Urgent</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="exclusive">Exclusive & VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="specialInstructions">Special Instructions (Optional)</Label>
          <Textarea
            id="specialInstructions"
            placeholder="Any additional context for the AI..."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Generate Email
      </Button>
    </form>
  );
}
