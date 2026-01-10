import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { UserPlus, Users, RefreshCw, Tag, TrendingUp, TrendingDown } from "lucide-react";

// Customer retention data
const customerBreakdown = {
  newCustomers: 234,
  returningCustomers: 658,
  totalCustomers: 892,
  newCustomersPrevWeek: 198,
  returningCustomersPrevWeek: 612,
};

const newVsReturningData = [
  { name: "Returning", value: customerBreakdown.returningCustomers, color: "hsl(var(--primary))" },
  { name: "New", value: customerBreakdown.newCustomers, color: "hsl(var(--muted-foreground))" },
];

// Repeat order rate
const repeatOrderMetrics = {
  repeatRate: 42, // % of customers who ordered more than once this month
  repeatRatePrevMonth: 38,
  avgOrdersPerRepeat: 3.2,
  avgOrdersPerRepeatPrev: 2.9,
};

// Promo impact data
const promoImpact = {
  promoOrders: 312,
  nonPromoOrders: 844,
  totalOrders: 1156,
  promoRevenue: 8420,
  nonPromoRevenue: 28680,
  promoAvgCheck: 27.0,
  nonPromoAvgCheck: 34.0,
  promoOrdersPrevWeek: 285,
};

const promoBreakdownData = [
  { name: "Regular Orders", value: promoImpact.nonPromoOrders, color: "hsl(var(--primary))" },
  { name: "Promo Orders", value: promoImpact.promoOrders, color: "hsl(var(--chart-4))" },
];

// Visit frequency simplified
const visitFrequencySimple = [
  { label: "First-timers", count: 234, percentage: 26 },
  { label: "2-3 visits", count: 320, percentage: 36 },
  { label: "4+ visits (Regulars)", count: 338, percentage: 38 },
];

function PercentChange({ current, previous, suffix = "" }: { current: number; previous: number; suffix?: string }) {
  const change = ((current - previous) / previous) * 100;
  const isPositive = change > 0;
  
  return (
    <span className={`text-xs flex items-center gap-0.5 ${isPositive ? "text-green-600" : "text-red-600"}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}{change.toFixed(0)}%{suffix}
    </span>
  );
}

export function CustomerInsights() {
  const returningPct = Math.round((customerBreakdown.returningCustomers / customerBreakdown.totalCustomers) * 100);
  const promoPct = Math.round((promoImpact.promoOrders / promoImpact.totalOrders) * 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          👥 Customer Behavior
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Retention & promotion insights
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="retention" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="retention">Retention</TabsTrigger>
            <TabsTrigger value="repeat">Repeat Rate</TabsTrigger>
            <TabsTrigger value="promos">Promo Impact</TabsTrigger>
          </TabsList>

          {/* Retention Tab - New vs Returning */}
          <TabsContent value="retention">
            <div className="grid grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={newVsReturningData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {newVsReturningData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [value, "Customers"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Stats */}
              <div className="flex flex-col justify-center space-y-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Returning</span>
                    </div>
                    <PercentChange 
                      current={customerBreakdown.returningCustomers} 
                      previous={customerBreakdown.returningCustomersPrevWeek}
                      suffix=" vs LW"
                    />
                  </div>
                  <p className="text-2xl font-bold">{customerBreakdown.returningCustomers}</p>
                  <p className="text-xs text-muted-foreground">{returningPct}% of total</p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">New</span>
                    </div>
                    <PercentChange 
                      current={customerBreakdown.newCustomers} 
                      previous={customerBreakdown.newCustomersPrevWeek}
                      suffix=" vs LW"
                    />
                  </div>
                  <p className="text-2xl font-bold">{customerBreakdown.newCustomers}</p>
                  <p className="text-xs text-muted-foreground">{100 - returningPct}% of total</p>
                </div>
              </div>
            </div>

            {/* Visit Frequency Breakdown */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-3">Customer Loyalty Breakdown</p>
              <div className="space-y-2">
                {visitFrequencySimple.map((segment) => (
                  <div key={segment.label} className="flex items-center gap-3">
                    <div className="w-28 text-sm">{segment.label}</div>
                    <Progress value={segment.percentage} className="flex-1 h-2" />
                    <div className="w-16 text-right text-sm text-muted-foreground">
                      {segment.count} ({segment.percentage}%)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Repeat Rate Tab */}
          <TabsContent value="repeat">
            <div className="space-y-6">
              {/* Main Metric */}
              <div className="text-center py-6 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Repeat Order Rate</span>
                </div>
                <p className="text-5xl font-bold text-foreground">{repeatOrderMetrics.repeatRate}%</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <PercentChange 
                    current={repeatOrderMetrics.repeatRate} 
                    previous={repeatOrderMetrics.repeatRatePrevMonth} 
                    suffix=" vs last month"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {repeatOrderMetrics.repeatRate}% of customers ordered more than once this month
                </p>
              </div>

              {/* Supporting Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-xs text-muted-foreground mb-1">Avg Orders per Repeat Customer</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{repeatOrderMetrics.avgOrdersPerRepeat}</span>
                    <PercentChange 
                      current={repeatOrderMetrics.avgOrdersPerRepeat} 
                      previous={repeatOrderMetrics.avgOrdersPerRepeatPrev}
                    />
                  </div>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-xs text-muted-foreground mb-1">Loyal Customers (4+ visits)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">338</span>
                    <span className="text-xs text-muted-foreground">38% of base</span>
                  </div>
                </div>
              </div>

              {/* Insight */}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-700 dark:text-green-400">
                  ✓ Repeat rate improving — up 4 points from last month
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Promo Impact Tab */}
          <TabsContent value="promos">
            <div className="space-y-4">
              {/* Promo vs Non-Promo Split */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-sm font-medium">Regular Orders</span>
                  </div>
                  <p className="text-2xl font-bold">{promoImpact.nonPromoOrders}</p>
                  <p className="text-xs text-muted-foreground">{100 - promoPct}% of orders</p>
                  <p className="text-sm mt-2">
                    Avg check: <span className="font-semibold">${promoImpact.nonPromoAvgCheck.toFixed(2)}</span>
                  </p>
                </div>

                <div className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-chart-4" />
                    <span className="text-sm font-medium">Promo Orders</span>
                  </div>
                  <p className="text-2xl font-bold">{promoImpact.promoOrders}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{promoPct}% of orders</p>
                    <PercentChange 
                      current={promoImpact.promoOrders} 
                      previous={promoImpact.promoOrdersPrevWeek}
                      suffix=" WoW"
                    />
                  </div>
                  <p className="text-sm mt-2">
                    Avg check: <span className="font-semibold">${promoImpact.promoAvgCheck.toFixed(2)}</span>
                  </p>
                </div>
              </div>

              {/* Visual Comparison */}
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[promoImpact]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="nonPromoOrders" name="Regular" stackId="a" fill="hsl(var(--primary))" />
                    <Bar dataKey="promoOrders" name="Promo" stackId="a" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Key Insight */}
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  ⚠ Promo avg check is ${(promoImpact.nonPromoAvgCheck - promoImpact.promoAvgCheck).toFixed(2)} lower than regular — monitor margin impact
                </p>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Promo Revenue</p>
                  <p className="text-lg font-semibold">${promoImpact.promoRevenue.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Regular Revenue</p>
                  <p className="text-lg font-semibold">${promoImpact.nonPromoRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
