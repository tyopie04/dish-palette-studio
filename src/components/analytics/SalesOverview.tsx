import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
} from "recharts";

// Placeholder data
const salesOverTimeData = [
  { date: "Mon", sales: 4200 },
  { date: "Tue", sales: 3800 },
  { date: "Wed", sales: 5100 },
  { date: "Thu", sales: 4600 },
  { date: "Fri", sales: 6800 },
  { date: "Sat", sales: 7200 },
  { date: "Sun", sales: 5400 },
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

export function SalesOverview() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          💰 Sales Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="overview">Total Sales</TabsTrigger>
            <TabsTrigger value="by-item">By Item</TabsTrigger>
            <TabsTrigger value="by-category">By Category</TabsTrigger>
            <TabsTrigger value="by-server">By Server</TabsTrigger>
            <TabsTrigger value="margins">Margins</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
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
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
                      <TableCell className="text-right text-green-500">{row.margin}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
