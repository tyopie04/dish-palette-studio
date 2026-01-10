import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

// Placeholder data - By Day
const salesOverTimeData = [
  { date: "Mon", sales: 4200 },
  { date: "Tue", sales: 3800 },
  { date: "Wed", sales: 5100 },
  { date: "Thu", sales: 4600 },
  { date: "Fri", sales: 6800 },
  { date: "Sat", sales: 7200 },
  { date: "Sun", sales: 5400 },
];

// Placeholder data - By Hour with daypart groupings
const salesByHourData = [
  { hour: "6am", sales: 320, prevWeek: 340, daypart: "Breakfast" },
  { hour: "7am", sales: 580, prevWeek: 520, daypart: "Breakfast" },
  { hour: "8am", sales: 920, prevWeek: 880, daypart: "Breakfast" },
  { hour: "9am", sales: 1100, prevWeek: 1050, daypart: "Breakfast" },
  { hour: "10am", sales: 780, prevWeek: 820, daypart: "Breakfast" },
  { hour: "11am", sales: 1450, prevWeek: 1380, daypart: "Lunch" },
  { hour: "12pm", sales: 2100, prevWeek: 2050, daypart: "Lunch" },
  { hour: "1pm", sales: 1980, prevWeek: 1920, daypart: "Lunch" },
  { hour: "2pm", sales: 1200, prevWeek: 1450, daypart: "Lunch" },
  { hour: "5pm", sales: 1650, prevWeek: 1580, daypart: "Dinner" },
  { hour: "6pm", sales: 2400, prevWeek: 2350, daypart: "Dinner" },
  { hour: "7pm", sales: 2680, prevWeek: 2520, daypart: "Dinner" },
  { hour: "8pm", sales: 2100, prevWeek: 2180, daypart: "Dinner" },
  { hour: "9pm", sales: 1200, prevWeek: 1250, daypart: "Dinner" },
  { hour: "10pm", sales: 680, prevWeek: 720, daypart: "Late Night" },
  { hour: "11pm", sales: 420, prevWeek: 380, daypart: "Late Night" },
];

const peakHour = salesByHourData.reduce((max, item) => item.sales > max.sales ? item : max, salesByHourData[0]);
const lowPerformers = salesByHourData.filter(item => {
  const changePercent = ((item.sales - item.prevWeek) / item.prevWeek) * 100;
  return changePercent < -10;
});

const daypartSummary = [
  { name: "Breakfast", hours: "6am–10am", sales: 3700, prevWeek: 3610, orders: 142 },
  { name: "Lunch", hours: "11am–2pm", sales: 6730, prevWeek: 6800, orders: 245 },
  { name: "Dinner", hours: "5pm–9pm", sales: 10030, prevWeek: 9880, orders: 312 },
  { name: "Late Night", hours: "10pm–12am", sales: 1100, prevWeek: 1100, orders: 48 },
];

const salesByCategoryData = [
  { category: "Burgers", sales: 12400 },
  { category: "Sides", sales: 8200 },
  { category: "Drinks", sales: 6800 },
  { category: "Desserts", sales: 4200 },
  { category: "Specials", sales: 3800 },
];

const salesByItemData = [
  { item: "Classic Burger", category: "Burgers", quantity: 245, revenue: 3185, margin: "42%" },
  { item: "Cheese Fries", category: "Sides", quantity: 198, revenue: 1188, margin: "58%" },
  { item: "Chicken Sandwich", category: "Burgers", quantity: 167, revenue: 2171, margin: "45%" },
  { item: "Milkshake", category: "Drinks", quantity: 134, revenue: 804, margin: "65%" },
  { item: "Onion Rings", category: "Sides", quantity: 112, revenue: 560, margin: "62%" },
];

const salesByServerData = [
  { server: "Alex M.", orders: 45, sales: 1420, avgCheck: "$31.55" },
  { server: "Jordan K.", orders: 38, sales: 1180, avgCheck: "$31.05" },
  { server: "Sam T.", orders: 42, sales: 1350, avgCheck: "$32.14" },
  { server: "Casey R.", orders: 31, sales: 942, avgCheck: "$30.39" },
];

// Menu Margin Insights data
interface MarginItem {
  item: string;
  category: string;
  totalSales: number;
  marginPercent: number;
  unitsSold: number;
}

const menuMarginData: MarginItem[] = [
  { item: "Classic Burger", category: "Burgers", totalSales: 3185, marginPercent: 42, unitsSold: 245 },
  { item: "Loaded Nachos", category: "Appetizers", totalSales: 2840, marginPercent: 28, unitsSold: 189 },
  { item: "Cheese Fries", category: "Sides", totalSales: 1188, marginPercent: 58, unitsSold: 198 },
  { item: "Chicken Sandwich", category: "Burgers", totalSales: 2171, marginPercent: 45, unitsSold: 167 },
  { item: "Premium Steak", category: "Entrees", totalSales: 4200, marginPercent: 22, unitsSold: 84 },
  { item: "Milkshake", category: "Drinks", totalSales: 804, marginPercent: 65, unitsSold: 134 },
  { item: "Truffle Fries", category: "Sides", totalSales: 420, marginPercent: 72, unitsSold: 35 },
  { item: "House Salad", category: "Salads", totalSales: 380, marginPercent: 68, unitsSold: 48 },
  { item: "BBQ Ribs", category: "Entrees", totalSales: 3600, marginPercent: 31, unitsSold: 72 },
  { item: "Onion Rings", category: "Sides", totalSales: 560, marginPercent: 62, unitsSold: 112 },
];

const HIGH_SALES_THRESHOLD = 2000;
const LOW_MARGIN_THRESHOLD = 35;
const HIGH_MARGIN_THRESHOLD = 55;
const LOW_SALES_THRESHOLD = 600;

type MarginFlag = "hurts-profit" | "hidden-gem" | "star" | "none";

const getMarginFlag = (item: MarginItem): MarginFlag => {
  const isHighSales = item.totalSales >= HIGH_SALES_THRESHOLD;
  const isLowSales = item.totalSales < LOW_SALES_THRESHOLD;
  const isLowMargin = item.marginPercent < LOW_MARGIN_THRESHOLD;
  const isHighMargin = item.marginPercent >= HIGH_MARGIN_THRESHOLD;
  
  if (isHighSales && isLowMargin) return "hurts-profit";
  if (isLowSales && isHighMargin) return "hidden-gem";
  if (isHighSales && isHighMargin) return "star";
  return "none";
};

const flagLabels: Record<MarginFlag, { label: string; className: string } | null> = {
  "hurts-profit": { 
    label: "⚠️ Hurts profit", 
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" 
  },
  "hidden-gem": { 
    label: "💎 Hidden gem", 
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" 
  },
  "star": { 
    label: "⭐ Star item", 
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" 
  },
  "none": null,
};

const sortedMarginData = [...menuMarginData].sort((a, b) => {
  const flagA = getMarginFlag(a);
  const flagB = getMarginFlag(b);
  if (flagA !== "none" && flagB === "none") return -1;
  if (flagA === "none" && flagB !== "none") return 1;
  return b.totalSales - a.totalSales;
});

const daypartColors: Record<string, string> = {
  Breakfast: "hsl(45, 93%, 47%)",
  Lunch: "hsl(var(--primary))",
  Dinner: "hsl(262, 83%, 58%)",
  "Late Night": "hsl(220, 70%, 50%)",
};

export function SalesOverview() {
  const [timeView, setTimeView] = useState<"hour" | "day">("hour");

  const getBarColor = (entry: typeof salesByHourData[0]) => {
    const isPeak = entry.hour === peakHour.hour;
    const isLow = lowPerformers.some(lp => lp.hour === entry.hour);
    
    if (isPeak) return "hsl(142, 76%, 36%)";
    if (isLow) return "hsl(var(--destructive))";
    return daypartColors[entry.daypart];
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          💰 Sales Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-4">
            <TabsTrigger value="overview">Total Sales</TabsTrigger>
            <TabsTrigger value="by-item">By Item</TabsTrigger>
            <TabsTrigger value="by-category">By Category</TabsTrigger>
            <TabsTrigger value="by-server">By Server</TabsTrigger>
            <TabsTrigger value="margins">Margins</TabsTrigger>
            <TabsTrigger value="margin-insights">Margin Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="flex items-center justify-between mb-4">
              <ToggleGroup
                type="single"
                value={timeView}
                onValueChange={(value) => value && setTimeView(value as "hour" | "day")}
                className="bg-muted p-1 rounded-lg"
              >
                <ToggleGroupItem value="hour" className="text-xs px-3 data-[state=on]:bg-background">
                  By Hour
                </ToggleGroupItem>
                <ToggleGroupItem value="day" className="text-xs px-3 data-[state=on]:bg-background">
                  By Day
                </ToggleGroupItem>
              </ToggleGroup>

              {timeView === "hour" && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Peak Hour
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                    Down vs LW
                  </span>
                </div>
              )}
            </div>

            {timeView === "hour" ? (
              <>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {daypartSummary.map((dp) => {
                    const change = ((dp.sales - dp.prevWeek) / dp.prevWeek) * 100;
                    const isDown = change < 0;
                    return (
                      <div
                        key={dp.name}
                        className="p-2.5 rounded-lg border bg-card/50"
                        style={{ borderLeftColor: daypartColors[dp.name], borderLeftWidth: 3 }}
                      >
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                          {dp.name}
                        </p>
                        <p className="text-sm font-semibold">${dp.sales.toLocaleString()}</p>
                        <p className={cn(
                          "text-[10px]",
                          isDown ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                        )}>
                          {change >= 0 ? "+" : ""}{change.toFixed(1)}% vs LW
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByHourData} barCategoryGap="15%">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis dataKey="hour" tick={{ fontSize: 10 }} className="text-muted-foreground" interval={0} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} className="text-muted-foreground" width={45} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const change = ((data.sales - data.prevWeek) / data.prevWeek) * 100;
                            const isPeak = data.hour === peakHour.hour;
                            return (
                              <div className="bg-card border border-border rounded-lg p-2 shadow-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold">{data.hour}</span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{data.daypart}</Badge>
                                  {isPeak && <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500">Peak</Badge>}
                                </div>
                                <p className="text-sm">${data.sales.toLocaleString()}</p>
                                <p className={cn("text-xs", change < 0 ? "text-destructive" : "text-muted-foreground")}>
                                  {change >= 0 ? "+" : ""}{change.toFixed(1)}% vs last week
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="sales" radius={[3, 3, 0, 0]}>
                        {salesByHourData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

              </>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesOverTimeData}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Sales"]}
                    />
                    <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="by-item">
            <div className="max-h-[280px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesByItemData.map((row) => (
                    <TableRow key={row.item}>
                      <TableCell className="font-medium">{row.item}</TableCell>
                      <TableCell className="text-muted-foreground">{row.category}</TableCell>
                      <TableCell className="text-right">{row.quantity}</TableCell>
                      <TableCell className="text-right">${row.revenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="by-category">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByCategoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Sales"]}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="by-server">
            <div className="max-h-[280px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Server</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Avg Check</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesByServerData.map((row) => (
                    <TableRow key={row.server}>
                      <TableCell className="font-medium">{row.server}</TableCell>
                      <TableCell className="text-right">{row.orders}</TableCell>
                      <TableCell className="text-right">${row.sales.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{row.avgCheck}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="margins">
            <div className="max-h-[280px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Gross Margin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesByItemData.map((row) => (
                    <TableRow key={row.item}>
                      <TableCell className="font-medium">{row.item}</TableCell>
                      <TableCell className="text-right">${row.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400">{row.margin}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="margin-insights">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3 text-xs pb-2 border-b border-border">
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400">⚠️</span>
                  High sales, low margin
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">💎</span>
                  Low sales, high margin — promote more
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">⭐</span>
                  Star performer
                </span>
              </div>

              <div className="max-h-[240px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMarginData.map((row) => {
                      const flag = getMarginFlag(row);
                      const flagInfo = flagLabels[flag];
                      return (
                        <TableRow key={row.item} className={flag !== "none" ? "bg-muted/30" : ""}>
                          <TableCell>
                            <div>
                              <span className="font-medium">{row.item}</span>
                              <span className="text-xs text-muted-foreground ml-2">{row.unitsSold} sold</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">${row.totalSales.toLocaleString()}</TableCell>
                          <TableCell className={cn(
                            "text-right font-medium",
                            row.marginPercent >= HIGH_MARGIN_THRESHOLD 
                              ? "text-emerald-600 dark:text-emerald-400"
                              : row.marginPercent < LOW_MARGIN_THRESHOLD
                                ? "text-amber-600 dark:text-amber-400"
                                : ""
                          )}>
                            {row.marginPercent}%
                          </TableCell>
                          <TableCell className="text-right">
                            {flagInfo ? (
                              <Badge variant="secondary" className={cn("text-xs font-medium", flagInfo.className)}>
                                {flagInfo.label}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
