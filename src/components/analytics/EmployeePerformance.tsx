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
  Cell,
} from "recharts";
import { AlertTriangle, TrendingDown, Percent, Ban } from "lucide-react";

// Combined employee data with all metrics for exception-based analysis
const employeeData = [
  { name: "Alex M.", sales: 4250, avgCheck: 34.2, orders: 124, voids: 2, discounts: 45, voidAmount: 28, discountAmount: 156 },
  { name: "Jordan K.", sales: 3890, avgCheck: 31.8, orders: 122, voids: 1, discounts: 38, voidAmount: 14, discountAmount: 142 },
  { name: "Sam T.", sales: 3650, avgCheck: 29.5, orders: 124, voids: 8, discounts: 62, voidAmount: 112, discountAmount: 248 },
  { name: "Casey R.", sales: 3420, avgCheck: 32.1, orders: 107, voids: 3, discounts: 41, voidAmount: 42, discountAmount: 164 },
  { name: "Taylor P.", sales: 2980, avgCheck: 28.9, orders: 103, voids: 5, discounts: 78, voidAmount: 68, discountAmount: 312 },
  { name: "Morgan L.", sales: 2750, avgCheck: 27.5, orders: 100, voids: 1, discounts: 35, voidAmount: 12, discountAmount: 128 },
];

// Calculate team averages
const teamAverages = {
  avgCheck: employeeData.reduce((sum, e) => sum + e.avgCheck, 0) / employeeData.length,
  voidRate: employeeData.reduce((sum, e) => sum + (e.voids / e.orders), 0) / employeeData.length,
  discountRate: employeeData.reduce((sum, e) => sum + (e.discounts / e.orders), 0) / employeeData.length,
};

// Thresholds for flagging (1.5x above average or 20% below for avg check)
const VOID_THRESHOLD = teamAverages.voidRate * 1.5;
const DISCOUNT_THRESHOLD = teamAverages.discountRate * 1.5;
const LOW_CHECK_THRESHOLD = teamAverages.avgCheck * 0.85;

type ExceptionType = "high-voids" | "high-discounts" | "low-check";

interface EmployeeException {
  type: ExceptionType;
  label: string;
  icon: React.ReactNode;
  severity: "warning" | "info";
}

function getEmployeeExceptions(employee: typeof employeeData[0]): EmployeeException[] {
  const exceptions: EmployeeException[] = [];
  
  const voidRate = employee.voids / employee.orders;
  const discountRate = employee.discounts / employee.orders;
  
  if (voidRate > VOID_THRESHOLD) {
    exceptions.push({
      type: "high-voids",
      label: "High voids",
      icon: <Ban className="h-3 w-3" />,
      severity: "warning",
    });
  }
  
  if (discountRate > DISCOUNT_THRESHOLD) {
    exceptions.push({
      type: "high-discounts",
      label: "High discounts",
      icon: <Percent className="h-3 w-3" />,
      severity: "warning",
    });
  }
  
  if (employee.avgCheck < LOW_CHECK_THRESHOLD) {
    exceptions.push({
      type: "low-check",
      label: "Low avg check",
      icon: <TrendingDown className="h-3 w-3" />,
      severity: "info",
    });
  }
  
  return exceptions;
}

// Prepare chart data with exception flags
const chartData = employeeData.map((emp) => ({
  ...emp,
  exceptions: getEmployeeExceptions(emp),
  hasException: getEmployeeExceptions(emp).length > 0,
}));

// Get employees with exceptions for the summary view
const employeesWithExceptions = chartData.filter((emp) => emp.hasException);

export function EmployeePerformance() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          👨‍🍳 Team Analytics
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Exception-based insights for coaching opportunities
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="exceptions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
            <TabsTrigger value="sales">Sales by Server</TabsTrigger>
          </TabsList>

          <TabsContent value="exceptions">
            <div className="space-y-4">
              {/* Team Averages Reference */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-muted/50 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground">Team Avg Check</span>
                  <p className="font-semibold">${teamAverages.avgCheck.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Void Rate</span>
                  <p className="font-semibold">{(teamAverages.voidRate * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Discount Rate</span>
                  <p className="font-semibold">{(teamAverages.discountRate * 100).toFixed(1)}%</p>
                </div>
              </div>

              {/* Exceptions Table */}
              {employeesWithExceptions.length > 0 ? (
                <div className="max-h-[240px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Team Member</TableHead>
                        <TableHead>Issues</TableHead>
                        <TableHead className="text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeesWithExceptions.map((emp) => (
                        <TableRow key={emp.name}>
                          <TableCell className="font-medium">{emp.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {emp.exceptions.map((ex, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant={ex.severity === "warning" ? "destructive" : "secondary"}
                                  className="text-xs flex items-center gap-1 font-normal"
                                >
                                  {ex.icon}
                                  {ex.label}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            <div className="space-y-0.5">
                              {emp.exceptions.some(e => e.type === "high-voids") && (
                                <div>{emp.voids} voids (${emp.voidAmount})</div>
                              )}
                              {emp.exceptions.some(e => e.type === "high-discounts") && (
                                <div>{emp.discounts} discounts (${emp.discountAmount})</div>
                              )}
                              {emp.exceptions.some(e => e.type === "low-check") && (
                                <div>Avg ${emp.avgCheck.toFixed(2)} check</div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">✓ No exceptions this period</p>
                  <p className="text-xs mt-1">All team members within normal ranges</p>
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground border-t">
                <div className="flex items-center gap-1.5">
                  <Ban className="h-3 w-3 text-destructive" />
                  <span>Voids &gt;1.5x avg</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Percent className="h-3 w-3 text-destructive" />
                  <span>Discounts &gt;1.5x avg</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="h-3 w-3 text-muted-foreground" />
                  <span>Avg check &lt;85% of team</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sales">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm">${data.sales.toLocaleString()} sales</p>
                            <p className="text-xs text-muted-foreground">Avg check: ${data.avgCheck}</p>
                            {data.exceptions.length > 0 && (
                              <div className="mt-2 pt-2 border-t space-y-1">
                                {data.exceptions.map((ex: EmployeeException, idx: number) => (
                                  <div key={idx} className="text-xs flex items-center gap-1 text-destructive">
                                    <AlertTriangle className="h-3 w-3" />
                                    {ex.label}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.hasException ? "hsl(var(--destructive))" : "hsl(var(--primary))"} 
                        opacity={entry.hasException ? 0.8 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-muted-foreground text-center mt-2 flex items-center justify-center gap-2">
                <span className="inline-block w-3 h-3 rounded-sm bg-destructive/80"></span>
                Has exception flagged
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
