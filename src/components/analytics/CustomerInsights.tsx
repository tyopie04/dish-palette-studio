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
  LineChart,
  Line,
} from "recharts";
import { ThumbsUp, ThumbsDown, Meh } from "lucide-react";

const visitFrequencyData = [
  { visits: "1", customers: 450 },
  { visits: "2-3", customers: 320 },
  { visits: "4-5", customers: 180 },
  { visits: "6-10", customers: 95 },
  { visits: "10+", customers: 45 },
];

const avgSpendData = [
  { week: "W1", current: 28.5, previous: 26.2 },
  { week: "W2", current: 31.2, previous: 27.8 },
  { week: "W3", current: 29.8, previous: 28.5 },
  { week: "W4", current: 32.4, previous: 29.1 },
];

const repeatOrdersData = [
  { item: "Classic Burger", frequency: 156, percentage: "32%" },
  { item: "Cheese Fries", frequency: 124, percentage: "26%" },
  { item: "Chocolate Shake", frequency: 98, percentage: "20%" },
  { item: "Onion Rings", frequency: 67, percentage: "14%" },
  { item: "Grilled Chicken", frequency: 42, percentage: "9%" },
];

const topCustomersData = [
  { name: "John D.", visits: 24, totalSpend: "$892", lastVisit: "Today" },
  { name: "Sarah M.", visits: 21, totalSpend: "$756", lastVisit: "Yesterday" },
  { name: "Mike R.", visits: 18, totalSpend: "$634", lastVisit: "2 days ago" },
  { name: "Emily K.", visits: 16, totalSpend: "$589", lastVisit: "Today" },
  { name: "Chris P.", visits: 14, totalSpend: "$512", lastVisit: "3 days ago" },
];

const feedbackData = {
  nps: 72,
  positive: 68,
  neutral: 22,
  negative: 10,
  recentComments: [
    { sentiment: "positive", text: "Great food, fast service!", date: "Today" },
    { sentiment: "positive", text: "Love the new menu items", date: "Yesterday" },
    { sentiment: "neutral", text: "Good but a bit pricey", date: "2 days ago" },
    { sentiment: "negative", text: "Wait time was too long", date: "3 days ago" },
  ],
};

export function CustomerInsights() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          👥 Customer Behavior
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="frequency" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="frequency">Visit Frequency</TabsTrigger>
            <TabsTrigger value="spending">Avg Spend</TabsTrigger>
            <TabsTrigger value="repeats">Repeat Orders</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="frequency">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visitFrequencyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="visits" tick={{ fontSize: 12 }} label={{ value: "Visits/Month", position: "bottom", fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [value, "Customers"]}
                  />
                  <Bar dataKey="customers" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="spending">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={avgSpendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                  />
                  <Line
                    type="monotone"
                    dataKey="current"
                    name="This Month"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="previous"
                    name="Last Month"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="repeats">
            <div className="grid grid-cols-2 gap-4 h-[280px]">
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Repeat %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repeatOrdersData.map((row) => (
                      <TableRow key={row.item}>
                        <TableCell className="font-medium text-sm">{row.item}</TableCell>
                        <TableCell className="text-right text-sm">{row.percentage}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="overflow-auto">
                <p className="text-sm font-medium text-muted-foreground mb-2">Top Customers</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomersData.slice(0, 5).map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium text-sm">{row.name}</TableCell>
                        <TableCell className="text-right text-sm">{row.visits}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="feedback">
            <div className="h-[280px] grid grid-cols-2 gap-6">
              {/* NPS Score */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="hsl(var(--muted))"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="hsl(142 76% 45%)"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(feedbackData.nps / 100) * 352} 352`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{feedbackData.nps}</span>
                    <span className="text-xs text-muted-foreground">NPS</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feedbackData.positive}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Meh className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{feedbackData.neutral}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm">{feedbackData.negative}%</span>
                  </div>
                </div>
              </div>

              {/* Recent Comments */}
              <div className="space-y-2 overflow-auto">
                <p className="text-sm font-medium text-muted-foreground">Recent Feedback</p>
                {feedbackData.recentComments.map((comment, i) => (
                  <div key={i} className="p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          comment.sentiment === "positive"
                            ? "default"
                            : comment.sentiment === "negative"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {comment.sentiment}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{comment.date}</span>
                    </div>
                    <p className="text-sm text-foreground">"{comment.text}"</p>
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
