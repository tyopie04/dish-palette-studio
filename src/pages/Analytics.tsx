import { useState } from "react";
import { Header } from "@/components/Header";
import { WeeklyInsights } from "@/components/analytics/WeeklyInsights";
import { MetricCard } from "@/components/analytics/MetricCard";
import { SalesOverview } from "@/components/analytics/SalesOverview";
import { 
  DollarSign, 
  ShoppingBag, 
  Receipt,
  TrendingUp,
  ChevronDown
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Simplified location data
const locations = [
  { id: "all", name: "All Locations" },
  { id: "downtown", name: "Downtown" },
  { id: "midtown", name: "Midtown" },
];

export default function Analytics() {
  const [selectedLocation, setSelectedLocation] = useState("all");

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Minimal Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-semibold">Daily Dashboard</h1>
              <p className="text-sm text-muted-foreground">Last 7 days • Updated just now</p>
            </div>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 1. What Changed This Week */}
          <section className="mb-6">
            <WeeklyInsights />
          </section>

          {/* 2. Core KPIs */}
          <section id="sales-overview" className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Core Metrics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard
                title="Total Sales"
                value="$37,100"
                change="+12.5% vs last week"
                changeType="positive"
                icon={<DollarSign className="h-4 w-4" />}
              />
              <MetricCard
                title="Orders"
                value="1,156"
                change="+8.2% vs last week"
                changeType="positive"
                icon={<ShoppingBag className="h-4 w-4" />}
              />
              <MetricCard
                title="Avg Check"
                value="$32.10"
                change="+4.3% vs last week"
                changeType="positive"
                icon={<Receipt className="h-4 w-4" />}
              />
              <MetricCard
                title="Top Margin"
                value="65%"
                change="Milkshake"
                changeType="neutral"
                icon={<TrendingUp className="h-4 w-4" />}
              />
            </div>
          </section>

          {/* 3 & 4. When We're Busy + What We Sell (combined in SalesOverview) */}
          <section id="operational-metrics" className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Sales Insights</h2>
            <SalesOverview />
          </section>

        </div>
      </main>
    </div>
  );
}
