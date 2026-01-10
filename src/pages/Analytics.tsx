import { useState } from "react";
import { Header } from "@/components/Header";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { MetricCard } from "@/components/analytics/MetricCard";
import { SalesOverview } from "@/components/analytics/SalesOverview";
import { OperationalMetrics } from "@/components/analytics/OperationalMetrics";
import { CustomerInsights } from "@/components/analytics/CustomerInsights";
import { EmployeePerformance } from "@/components/analytics/EmployeePerformance";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  TrendingUp,
  Receipt
} from "lucide-react";

// Placeholder data
const locations = [
  { id: "all", name: "All Locations", connected: true },
  { id: "downtown", name: "Downtown Location", connected: true },
  { id: "midtown", name: "Midtown Location", connected: true },
  { id: "uptown", name: "Uptown Location", connected: false },
];

export default function Analytics() {
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [dateRange, setDateRange] = useState("7days");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto px-6 py-6">
          {/* Header with Filters */}
          <AnalyticsHeader
            locations={locations}
            selectedLocation={selectedLocation}
            onLocationChange={setSelectedLocation}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <MetricCard
              title="Total Sales"
              value="$37,100"
              change="+12.5% vs last week"
              changeType="positive"
              icon={<DollarSign className="h-5 w-5" />}
            />
            <MetricCard
              title="Orders"
              value="1,156"
              change="+8.2% vs last week"
              changeType="positive"
              icon={<ShoppingBag className="h-5 w-5" />}
            />
            <MetricCard
              title="Avg Check"
              value="$32.10"
              change="+4.3% vs last week"
              changeType="positive"
              icon={<Receipt className="h-5 w-5" />}
            />
            <MetricCard
              title="Customers"
              value="892"
              change="-2.1% vs last week"
              changeType="negative"
              icon={<Users className="h-5 w-5" />}
            />
            <MetricCard
              title="Top Margin"
              value="65%"
              change="Milkshake"
              changeType="neutral"
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sales Overview Section */}
            <SalesOverview />

            {/* Operational Metrics Section */}
            <OperationalMetrics />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Insights Section */}
            <CustomerInsights />

            {/* Employee Performance Section */}
            <EmployeePerformance />
          </div>
        </div>
      </main>
    </div>
  );
}
