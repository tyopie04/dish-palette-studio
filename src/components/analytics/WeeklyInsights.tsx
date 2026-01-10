import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  message: string;
  change: number;
  direction: "up" | "down";
  targetSection: string;
  category: "sales" | "orders" | "customers" | "operations" | "payments";
}

// Rule-based insight generation using placeholder data
const generateInsights = (): Insight[] => {
  // Placeholder data representing week-over-week changes
  const weeklyChanges = {
    totalSales: { current: 37100, previous: 33000 },
    totalOrders: { current: 1156, previous: 1068 },
    avgCheck: { current: 32.1, previous: 30.78 },
    customers: { current: 892, previous: 911 },
    lunchOrders: { current: 420, previous: 462 },
    dinnerOrders: { current: 580, previous: 520 },
    cardPayments: { current: 72, previous: 65 },
    voids: { current: 2.1, previous: 1.4 },
    discounts: { current: 8.5, previous: 6.2 },
  };

  const insights: Insight[] = [];

  // Rule 1: Total sales change > ±5%
  const salesChange = ((weeklyChanges.totalSales.current - weeklyChanges.totalSales.previous) / weeklyChanges.totalSales.previous) * 100;
  if (Math.abs(salesChange) > 5) {
    insights.push({
      id: "sales-change",
      message: `Total sales ${salesChange > 0 ? "up" : "down"} ${Math.abs(salesChange).toFixed(0)}% vs last week`,
      change: salesChange,
      direction: salesChange > 0 ? "up" : "down",
      targetSection: "sales-overview",
      category: "sales",
    });
  }

  // Rule 2: Orders change > ±5%
  const ordersChange = ((weeklyChanges.totalOrders.current - weeklyChanges.totalOrders.previous) / weeklyChanges.totalOrders.previous) * 100;
  if (Math.abs(ordersChange) > 5) {
    insights.push({
      id: "orders-change",
      message: `Order volume ${ordersChange > 0 ? "increased" : "decreased"} by ${Math.abs(ordersChange).toFixed(0)}%`,
      change: ordersChange,
      direction: ordersChange > 0 ? "up" : "down",
      targetSection: "sales-overview",
      category: "orders",
    });
  }

  // Rule 3: Lunch vs dinner shift
  const lunchChange = ((weeklyChanges.lunchOrders.current - weeklyChanges.lunchOrders.previous) / weeklyChanges.lunchOrders.previous) * 100;
  if (Math.abs(lunchChange) > 5) {
    insights.push({
      id: "lunch-change",
      message: `Lunch orders ${lunchChange > 0 ? "up" : "down"} ${Math.abs(lunchChange).toFixed(0)}% Tue–Thu`,
      change: lunchChange,
      direction: lunchChange > 0 ? "up" : "down",
      targetSection: "operational-metrics",
      category: "operations",
    });
  }

  // Rule 4: Payment mix shift
  const cardChange = weeklyChanges.cardPayments.current - weeklyChanges.cardPayments.previous;
  if (Math.abs(cardChange) > 5) {
    insights.push({
      id: "payment-shift",
      message: `Card payments now ${weeklyChanges.cardPayments.current}% of total (+${cardChange}pts)`,
      change: cardChange,
      direction: cardChange > 0 ? "up" : "down",
      targetSection: "operational-metrics",
      category: "payments",
    });
  }

  // Rule 5: Void/discount spike
  const voidChange = ((weeklyChanges.voids.current - weeklyChanges.voids.previous) / weeklyChanges.voids.previous) * 100;
  if (voidChange > 30) {
    insights.push({
      id: "void-spike",
      message: `Void rate up ${voidChange.toFixed(0)}% — review transactions`,
      change: voidChange,
      direction: "up",
      targetSection: "employee-performance",
      category: "operations",
    });
  }

  // Rule 6: Customer count change
  const customerChange = ((weeklyChanges.customers.current - weeklyChanges.customers.previous) / weeklyChanges.customers.previous) * 100;
  if (Math.abs(customerChange) > 2) {
    insights.push({
      id: "customer-change",
      message: `Unique customers ${customerChange > 0 ? "up" : "down"} ${Math.abs(customerChange).toFixed(0)}% this week`,
      change: customerChange,
      direction: customerChange > 0 ? "up" : "down",
      targetSection: "customer-insights",
      category: "customers",
    });
  }

  return insights.slice(0, 5); // Return max 5 insights
};

export function WeeklyInsights() {
  const insights = generateInsights();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getCategoryColor = (category: Insight["category"], direction: "up" | "down") => {
    // For negative metrics (voids, etc), "up" is bad
    const isPositive = category === "operations" && direction === "up" ? false : direction === "up";
    
    if (category === "operations" && direction === "up") {
      return "text-destructive";
    }
    return isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive";
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-primary animate-pulse" />
          What Changed This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {insights.map((insight) => (
            <button
              key={insight.id}
              onClick={() => scrollToSection(insight.targetSection)}
              className={cn(
                "group flex items-start gap-3 p-3 rounded-lg text-left transition-all",
                "bg-card hover:bg-accent border border-border hover:border-primary/30",
                "focus:outline-none focus:ring-2 focus:ring-primary/20"
              )}
            >
              <div
                className={cn(
                  "flex-shrink-0 mt-0.5 p-1.5 rounded-full",
                  insight.direction === "up"
                    ? insight.category === "operations" && insight.id.includes("void")
                      ? "bg-destructive/10"
                      : "bg-emerald-100 dark:bg-emerald-900/30"
                    : "bg-destructive/10"
                )}
              >
                {insight.direction === "up" ? (
                  <TrendingUp
                    className={cn(
                      "h-3.5 w-3.5",
                      getCategoryColor(insight.category, insight.direction)
                    )}
                  />
                ) : (
                  <TrendingDown
                    className={cn(
                      "h-3.5 w-3.5",
                      getCategoryColor(insight.category, insight.direction)
                    )}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {insight.message}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1 group-hover:text-primary transition-colors">
                  View details
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
