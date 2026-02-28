import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetAnalytics } from "@/database/analytics";
import {
  DateController,
  getPresetDates,
  type DateRange,
} from "@/components/analytics/date-controller";
import { formatMoney } from "../utils";

export function CategoryPerformanceCard() {
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getPresetDates("thisMonth"),
  );

  const from = new Date(`${dateRange.from}T00:00:00+01:00`).getTime();
  const to = new Date(`${dateRange.to}T23:59:59+01:00`).getTime();

  const analytics = useGetAnalytics({ from, to, granularity: "day" });

  const totalTransactions = analytics.categoryPerformance.reduce(
    (sum, c) => sum + c.transactions,
    0,
  );

  const categories = analytics.categoryPerformance.map((category) => ({
    name: category.name,
    transactions: category.transactions,
    percentage:
      totalTransactions > 0
        ? (category.transactions / totalTransactions) * 100
        : 0,
    revenue: category.revenue,
    profit: category.profit,
  }));

  const maxPercentage = Math.max(...categories.map((c) => c.percentage), 1);

  return (
    <Card id="category-performance">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>
              Revenue and profit share by category.
            </CardDescription>
          </div>
          <DateController
            defaultPreset="thisMonth"
            onChange={(range) => setDateRange(range)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length > 0 ? (
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.name} className="group relative">
                <div className="flex items-center gap-3">
                  <div className="w-[140px] truncate text-sm font-medium">
                    {category.name}
                  </div>
                  <div className="flex-1">
                    <div className="relative h-6 w-full rounded bg-muted">
                      <div
                        className="absolute inset-y-0 left-0 rounded bg-primary"
                        style={{
                          width: `${(category.percentage / maxPercentage) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="min-w-[100px] text-right text-sm font-medium">
                    {category.transactions.toLocaleString("fr-FR")} (
                    {category.percentage.toFixed(1)}%)
                  </div>
                </div>
                <div className="absolute left-0 top-full z-10 mt-2 hidden w-[200px] rounded-lg border border-border/50 bg-background p-3 shadow-xl group-hover:block">
                  <div className="text-sm font-medium">{category.name}</div>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Orders</span>
                      <span className="font-medium">
                        {category.transactions.toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-medium">
                        {formatMoney(category.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit</span>
                      <span className="font-medium">
                        {formatMoney(category.profit)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-[260px] items-center justify-center text-muted-foreground">
            No category data
          </div>
        )}
      </CardContent>
    </Card>
  );
}
