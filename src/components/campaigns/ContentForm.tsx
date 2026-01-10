import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

interface ContentFormProps {
  onClose: () => void;
}

const menuItemOptions = ["Burgers", "Pizza", "Salads", "Drinks", "Desserts", "Appetizers", "Sides"];
const platformOptions = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "twitter", label: "Twitter/X" },
  { id: "website", label: "Website" },
];

export function ContentForm({ onClose }: ContentFormProps) {
  const [campaignName, setCampaignName] = useState("");
  const [contentType, setContentType] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [contentTheme, setContentTheme] = useState("");
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
  const [toneStyle, setToneStyle] = useState("");
  const [postFrequency, setPostFrequency] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const toggleMenuItem = (item: string) => {
    setSelectedMenuItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting content:", {
      campaignName,
      contentType,
      selectedPlatforms,
      contentTheme,
      selectedMenuItems,
      toneStyle,
      postFrequency,
      specialInstructions,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">One-Click Content</h3>
        <Button type="button" variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="campaignName">Campaign Name</Label>
          <Input
            id="campaignName"
            placeholder="e.g., Summer Social Campaign"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
          />
        </div>

        <div>
          <Label>Content Type</Label>
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="social-post">Social Media Post</SelectItem>
              <SelectItem value="story">Story</SelectItem>
              <SelectItem value="carousel">Carousel</SelectItem>
              <SelectItem value="video-script">Video Script</SelectItem>
              <SelectItem value="blog-post">Blog Post</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="mb-2 block">Platform</Label>
          <div className="grid grid-cols-2 gap-2">
            {platformOptions.map((platform) => (
              <div key={platform.id} className="flex items-center space-x-2">
                <Checkbox
                  id={platform.id}
                  checked={selectedPlatforms.includes(platform.id)}
                  onCheckedChange={() => togglePlatform(platform.id)}
                />
                <label
                  htmlFor={platform.id}
                  className="text-sm cursor-pointer"
                >
                  {platform.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Content Theme</Label>
          <Select value={contentTheme} onValueChange={setContentTheme}>
            <SelectTrigger>
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="menu-highlight">Menu Highlight</SelectItem>
              <SelectItem value="behind-scenes">Behind the Scenes</SelectItem>
              <SelectItem value="testimonial">Customer Testimonial</SelectItem>
              <SelectItem value="seasonal">Seasonal Special</SelectItem>
              <SelectItem value="daily-special">Daily Special</SelectItem>
              <SelectItem value="brand-story">Brand Story</SelectItem>
            </SelectContent>
          </Select>
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
              <SelectItem value="casual">Casual & Fun</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="elegant">Elegant</SelectItem>
              <SelectItem value="playful">Playful</SelectItem>
              <SelectItem value="authentic">Authentic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Post Frequency</Label>
          <Select value={postFrequency} onValueChange={setPostFrequency}>
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="one-time">One-time</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="multiple-weekly">Multiple per week</SelectItem>
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
        Generate Content
      </Button>
    </form>
  );
}
