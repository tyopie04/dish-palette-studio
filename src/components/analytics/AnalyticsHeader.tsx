import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Wifi, WifiOff, CalendarIcon, Download, FileText, Share2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Location {
  id: string;
  name: string;
  connected: boolean;
}

interface AnalyticsHeaderProps {
  locations: Location[];
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
}

export function AnalyticsHeader({
  locations,
  selectedLocation,
  onLocationChange,
  dateRange,
  onDateRangeChange,
}: AnalyticsHeaderProps) {
  const currentLocation = locations.find((l) => l.id === selectedLocation);
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Restaurant performance insights</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Date Range Selector */}
          <Select value={dateRange} onValueChange={onDateRangeChange}>
            <SelectTrigger className="w-[140px]">
              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {/* Location Selector */}
          <Select value={selectedLocation} onValueChange={onLocationChange}>
            <SelectTrigger className="w-[200px]">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  <div className="flex items-center gap-2">
                    {location.name}
                    {location.connected ? (
                      <Wifi className="h-3 w-3 text-green-500" />
                    ) : (
                      <WifiOff className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge
            variant={currentLocation?.connected ? "default" : "secondary"}
            className="gap-1"
          >
            {currentLocation?.connected ? (
              <>
                <Wifi className="h-3 w-3" />
                POS Connected
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Not Connected
              </>
            )}
          </Badge>

          {/* Export Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2">
                <FileText className="h-4 w-4" />
                Download as PDF
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Download className="h-4 w-4" />
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Share2 className="h-4 w-4" />
                Share Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
