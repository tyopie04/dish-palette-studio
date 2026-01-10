import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  TrendingUp,
  MapPin,
  Wifi,
  WifiOff
} from "lucide-react";
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
  PieChart,
  Pie,
  Cell
} from "recharts";

// Placeholder data
const locations = [
  { id: "all", name: "All Locations", connected: true },
  { id: "downtown", name: "Downtown Location", connected: true },
  { id: "midtown", name: "Midtown Location", connected: true },
  { id: "uptown", name: "Uptown Location", connected: false },
];

const revenueData = [
  { day: "Mon", revenue: 4200 },
  { day: "Tue", revenue: 3800 },
  { day: "Wed", revenue: 5100 },
  { day: "Thu", revenue: 4600 },
  { day: "Fri", revenue: 6800 },
  { day: "Sat", revenue: 7200 },
  { day: "Sun", revenue: 5400 },
];

const topItemsData = [
  { name: "Classic Burger", orders: 245 },
  { name: "Cheese Fries", orders: 198 },
  { name: "Chicken Sandwich", orders: 167 },
  { name: "Milkshake", orders: 134 },
  { name: "Onion Rings", orders: 112 },
];

const peakHoursData = [
  { hour: "11am", orders: 45 },
  { hour: "12pm", orders: 89 },
  { hour: "1pm", orders: 78 },
  { hour: "2pm", orders: 42 },
  { hour: "5pm", orders: 56 },
  { hour: "6pm", orders: 95 },
  { hour: "7pm", orders: 112 },
  { hour: "8pm", orders: 87 },
];

const orderTypeData = [
  { name: "Dine-in", value: 45, color: "hsl(var(--primary))" },
  { name: "Takeout", value: 30, color: "hsl(var(--chart-2))" },
  { name: "Delivery", value: 25, color: "hsl(var(--chart-3))" },
];

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
}

function MetricCard({ title, value, change, changeType, icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
            <p className={`text-sm mt-1 ${
              changeType === "positive" ? "text-green-500" : 
              changeType === "negative" ? "text-red-500" : 
              "text-muted-foreground"
            }`}>
              {change}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [selectedLocation, setSelectedLocation] = useState("all");
  const currentLocation = locations.find(l => l.id === selectedLocation);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container max-w-7xl mx-auto px-6 py-8">
        {/* Header with Location Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">Restaurant performance insights</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
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
            
            <Badge variant={currentLocation?.connected ? "default" : "secondary"} className="gap-1">
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
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Today's Revenue"
            value="$4,892"
            change="+12.5% vs yesterday"
            changeType="positive"
            icon={<DollarSign className="h-6 w-6" />}
          />
          <MetricCard
            title="Orders"
            value="156"
            change="+8.2% vs yesterday"
            changeType="positive"
            icon={<ShoppingBag className="h-6 w-6" />}
          />
          <MetricCard
            title="Customers"
            value="124"
            change="-2.1% vs yesterday"
            changeType="negative"
            icon={<Users className="h-6 w-6" />}
          />
          <MetricCard
            title="Avg. Ticket"
            value="$31.36"
            change="+4.3% vs yesterday"
            changeType="positive"
            icon={<TrendingUp className="h-6 w-6" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekly Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Weekly Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                    <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Peak Hours Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Peak Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="hour" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                    <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number) => [value, "Orders"]}
                    />
                    <Bar 
                      dataKey="orders" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Menu Items */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Top Menu Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topItemsData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-medium text-foreground">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${(item.orders / topItemsData[0].orders) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">
                        {item.orders} orders
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Types Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Order Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {orderTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                      formatter={(value: number) => [`${value}%`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {orderTypeData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
