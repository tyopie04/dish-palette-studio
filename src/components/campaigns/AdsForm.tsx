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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";

interface AdsFormProps {
  onClose: () => void;
}

const menuItemOptions = ["Burgers", "Pizza", "Salads", "Drinks", "Desserts", "Appetizers", "Sides"];
const adPlatformOptions = [
  { id: "google", label: "Google Ads" },
  { id: "facebook", label: "Facebook Ads" },
  { id: "instagram", label: "Instagram Ads" },
  { id: "tiktok", label: "TikTok Ads" },
];

export function AdsForm({ onClose }: AdsFormProps) {
  const [campaignName, setCampaignName] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [campaignObjective, setCampaignObjective] = useState("");
  const [targetDemographics, setTargetDemographics] = useState("");
  const [budget, setBudget] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
  const [callToAction, setCallToAction] = useState("");
  const [geoTargeting, setGeoTargeting] = useState("");
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
    console.log("Submitting ads:", {
      campaignName,
      selectedPlatforms,
      campaignObjective,
      targetDemographics,
      budget,
      dateRange,
      selectedMenuItems,
      callToAction,
      geoTargeting,
      specialInstructions,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">One-Click Ads</h3>
        <Button type="button" variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="campaignName">Campaign Name</Label>
          <Input
            id="campaignName"
            placeholder="e.g., Summer Traffic Campaign"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
          />
        </div>

        <div>
          <Label className="mb-2 block">Ad Platform</Label>
          <div className="grid grid-cols-2 gap-2">
            {adPlatformOptions.map((platform) => (
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
          <Label>Campaign Objective</Label>
          <Select value={campaignObjective} onValueChange={setCampaignObjective}>
            <SelectTrigger>
              <SelectValue placeholder="Select objective" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="traffic">Drive Traffic</SelectItem>
              <SelectItem value="orders">Increase Orders</SelectItem>
              <SelectItem value="awareness">Build Awareness</SelectItem>
              <SelectItem value="new-item">Promote New Item</SelectItem>
              <SelectItem value="event">Event Promotion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="targetDemographics">Target Audience Demographics</Label>
          <Textarea
            id="targetDemographics"
            placeholder="e.g., Ages 25-45, within 10 miles, interested in food & dining"
            value={targetDemographics}
            onChange={(e) => setTargetDemographics(e.target.value)}
            rows={2}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Include age range, location radius, and interests
          </p>
        </div>

        <div>
          <Label htmlFor="budget">Budget</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input
              id="budget"
              type="number"
              placeholder="0.00"
              className="pl-7"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Daily or total budget</p>
        </div>

        <div>
          <Label>Campaign Duration</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border border-border z-50" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
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
          <Label>Call-to-Action</Label>
          <Select value={callToAction} onValueChange={setCallToAction}>
            <SelectTrigger>
              <SelectValue placeholder="Select CTA" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="order-now">Order Now</SelectItem>
              <SelectItem value="reserve">Reserve Table</SelectItem>
              <SelectItem value="view-menu">View Menu</SelectItem>
              <SelectItem value="learn-more">Learn More</SelectItem>
              <SelectItem value="directions">Get Directions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="geoTargeting">Geographic Targeting</Label>
          <Input
            id="geoTargeting"
            placeholder="e.g., 15 miles from restaurant"
            value={geoTargeting}
            onChange={(e) => setGeoTargeting(e.target.value)}
          />
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
        Generate Ad Campaign
      </Button>
    </form>
  );
}
