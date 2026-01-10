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

interface PromotionsFormProps {
  onClose: () => void;
}

const menuItemOptions = ["Burgers", "Pizza", "Salads", "Drinks", "Desserts", "Appetizers", "Sides"];

export function PromotionsForm({ onClose }: PromotionsFormProps) {
  const [campaignName, setCampaignName] = useState("");
  const [promotionType, setPromotionType] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [offerDetails, setOfferDetails] = useState("");
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const toggleMenuItem = (item: string) => {
    setSelectedMenuItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting promotion:", {
      campaignName,
      promotionType,
      targetAudience,
      dateRange,
      offerDetails,
      selectedMenuItems,
      budget,
      specialInstructions,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">One-Click Promotions</h3>
        <Button type="button" variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="campaignName">Campaign Name</Label>
          <Input
            id="campaignName"
            placeholder="e.g., Summer BOGO Special"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
          />
        </div>

        <div>
          <Label>Promotion Type</Label>
          <Select value={promotionType} onValueChange={setPromotionType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="discount">Discount Percentage</SelectItem>
              <SelectItem value="bogo">BOGO</SelectItem>
              <SelectItem value="free-item">Free Item</SelectItem>
              <SelectItem value="limited-time">Limited Time Offer</SelectItem>
              <SelectItem value="happy-hour">Happy Hour</SelectItem>
              <SelectItem value="combo">Combo Deal</SelectItem>
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
              <SelectItem value="all">All Customers</SelectItem>
              <SelectItem value="new">New Customers</SelectItem>
              <SelectItem value="loyal">Loyal Customers</SelectItem>
              <SelectItem value="lapsed">Lapsed Customers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Duration</Label>
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
          <Label htmlFor="offerDetails">Discount/Offer Details</Label>
          <Textarea
            id="offerDetails"
            placeholder="e.g., 20% off or Buy 1 Get 1 Free on Burgers"
            value={offerDetails}
            onChange={(e) => setOfferDetails(e.target.value)}
            rows={2}
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
          <Label htmlFor="budget">Budget/Goals (Optional)</Label>
          <Input
            id="budget"
            placeholder="e.g., Increase lunch sales by 30%"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
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
        Generate Promotion
      </Button>
    </form>
  );
}
