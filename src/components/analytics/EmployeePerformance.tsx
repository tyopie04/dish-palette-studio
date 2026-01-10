import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";

const salesByEmployeeData = [
  { name: "Alex M.", sales: 4250 },
  { name: "Jordan K.", sales: 3890 },
  { name: "Sam T.", sales: 3650 },
  { name: "Casey R.", sales: 3420 },
  { name: "Taylor P.", sales: 2980 },
  { name: "Morgan L.", sales: 2750 },
];

const checkSizeVsSalesData = [
  { name: "Alex M.", avgCheck: 34.2, totalSales: 4250, orders: 124 },
  { name: "Jordan K.", avgCheck: 31.8, totalSales: 3890, orders: 122 },
  { name: "Sam T.", avgCheck: 29.5, totalSales: 3650, orders: 124 },
  { name: "Casey R.", avgCheck: 32.1, totalSales: 3420, orders: 107 },
  { name: "Taylor P.", avgCheck: 28.9, totalSales: 2980, orders: 103 },
  { name: "Morgan L.", avgCheck: 27.5, totalSales: 2750, orders: 100 },
];

const voidsDiscountsData = [
  { employee: "Alex M.", voids: 2, discounts: 45, voidAmount: "$28", discountAmount: "$156", flag: false },
  { employee: "Jordan K.", voids: 1, discounts: 38, voidAmount: "$14", discountAmount: "$142", flag: false },
  { employee: "Sam T.", voids: 8, discounts: 62, voidAmount: "$112", discountAmount: "$248", flag: true },
  { employee: "Casey R.", voids: 3, discounts: 41, voidAmount: "$42", discountAmount: "$164", flag: false },
  { employee: "Taylor P.", voids: 5, discounts: 78, voidAmount: "$68", discountAmount: "$312", flag: true },
  { employee: "Morgan L.", voids: 1, discounts: 35, voidAmount: "$12", discountAmount: "$128", flag: false },
];

const teamAverage = {
  voids: 3.3,
  discounts: 49.8,
};

export function EmployeePerformance() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          👨‍🍳 Team Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="sales">Sales by Server</TabsTrigger>
            <TabsTrigger value="check-size">Check Size</TabsTrigger>
            <TabsTrigger value="voids">Voids/Discounts</TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByEmployeeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
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

          <TabsContent value="check-size">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    type="number"
                    dataKey="totalSales"
                    name="Total Sales"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${v}`}
                    label={{ value: "Total Sales", position: "bottom", fontSize: 11 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="avgCheck"
                    name="Avg Check"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `$${v}`}
                    label={{ value: "Avg Check", angle: -90, position: "left", fontSize: 11 }}
                  />
                  <ZAxis type="number" dataKey="orders" range={[100, 400]} name="Orders" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "Total Sales" || name === "Avg Check") return `$${value}`;
                      return value;
                    }}
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.name;
                      }
                      return "";
                    }}
                  />
                  <Scatter data={checkSizeVsSalesData} fill="hsl(var(--primary))" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="voids">
            <div className="max-h-[280px] overflow-auto">
              <div className="mb-3 text-xs text-muted-foreground">
                Team avg: {teamAverage.voids.toFixed(1)} voids, {teamAverage.discounts.toFixed(1)} discounts
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Voids</TableHead>
                    <TableHead className="text-right">Discounts</TableHead>
                    <TableHead className="text-right">Void $</TableHead>
                    <TableHead className="text-right">Discount $</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voidsDiscountsData.map((row) => (
                    <TableRow key={row.employee}>
                      <TableCell className="font-medium">{row.employee}</TableCell>
                      <TableCell className="text-right">{row.voids}</TableCell>
                      <TableCell className="text-right">{row.discounts}</TableCell>
                      <TableCell className="text-right">{row.voidAmount}</TableCell>
                      <TableCell className="text-right">{row.discountAmount}</TableCell>
                      <TableCell>
                        {row.flag && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-yellow-500" />
                Flagged: exceeds 1.5x team average
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
