import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

// Heatmap data for peak hours (hours x weekdays)
const peakHoursData = [
  { hour: "11am", Mon: 25, Tue: 30, Wed: 28, Thu: 32, Fri: 45, Sat: 55, Sun: 40 },
  { hour: "12pm", Mon: 65, Tue: 70, Wed: 68, Thu: 72, Fri: 85, Sat: 95, Sun: 80 },
  { hour: "1pm", Mon: 55, Tue: 58, Wed: 52, Thu: 60, Fri: 75, Sat: 85, Sun: 70 },
  { hour: "2pm", Mon: 30, Tue: 35, Wed: 32, Thu: 38, Fri: 45, Sat: 55, Sun: 42 },
  { hour: "5pm", Mon: 40, Tue: 42, Wed: 45, Thu: 48, Fri: 65, Sat: 75, Sun: 55 },
  { hour: "6pm", Mon: 70, Tue: 75, Wed: 72, Thu: 78, Fri: 95, Sat: 100, Sun: 85 },
  { hour: "7pm", Mon: 85, Tue: 88, Wed: 82, Thu: 90, Fri: 100, Sat: 100, Sun: 92 },
  { hour: "8pm", Mon: 60, Tue: 65, Wed: 58, Thu: 68, Fri: 80, Sat: 90, Sun: 75 },
];

const prepTimeData = [
  { time: "11am", prep: 8, fulfillment: 12 },
  { time: "12pm", prep: 12, fulfillment: 18 },
  { time: "1pm", prep: 10, fulfillment: 15 },
  { time: "2pm", prep: 7, fulfillment: 10 },
  { time: "5pm", prep: 9, fulfillment: 14 },
  { time: "6pm", prep: 14, fulfillment: 20 },
  { time: "7pm", prep: 15, fulfillment: 22 },
  { time: "8pm", prep: 11, fulfillment: 16 },
];

const paymentMethodData = [
  { name: "Card", value: 55, color: "hsl(var(--primary))" },
  { name: "Cash", value: 25, color: "hsl(var(--chart-2))" },
  { name: "Digital Wallet", value: 20, color: "hsl(var(--chart-3))" },
];

const turnoverData = {
  current: 2.4,
  target: 3.0,
  percentage: 80,
};

export function OperationalMetrics() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          ⏰ Operational Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="peak-hours" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="peak-hours">Peak Hours</TabsTrigger>
            <TabsTrigger value="prep-time">Prep Time</TabsTrigger>
            <TabsTrigger value="turnover">Turnover</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="peak-hours">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Fri" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Sat" fill="hsl(48 96% 40%)" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Sun" fill="hsl(48 96% 65%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="prep-time">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prepTimeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}min`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} min`, ""]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="prep"
                    name="Prep Time"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fulfillment"
                    name="Fulfillment"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="turnover">
            <div className="h-[280px] flex flex-col items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="hsl(var(--muted))"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="hsl(var(--primary))"
                    strokeWidth="16"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${turnoverData.percentage * 5.03} 503`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-foreground">
                    {turnoverData.current}
                  </span>
                  <span className="text-sm text-muted-foreground">turns/hour</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Target: {turnoverData.target} turns/hour
                </p>
                <p className="text-xs text-primary mt-1">
                  {turnoverData.percentage}% of target
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="h-[280px] flex items-center justify-center gap-8">
              <div className="w-[200px] h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value}%`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {paymentMethodData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-foreground">{entry.name}</span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {entry.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
