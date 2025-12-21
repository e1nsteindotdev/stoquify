import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "api/convex";
import { useState } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

type TimePeriod = "today" | "week" | "month" | "year" | "all";

const PERIOD_LABELS: Record<TimePeriod, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  year: "This Year",
  all: "All Time",
};

export const Route = createFileRoute("/_dashboard/(analytics)/")({
  component: Page,
});

function Page() {
  const [period, setPeriod] = useState<TimePeriod>("today");

  const salesData = useQuery(api.analytics.getSalesData, { period });
  const salesByPeriod = useQuery(api.analytics.getSalesByTimePeriod, { period });
  const productPerformance = useQuery(api.analytics.getProductPerformance, { period });

  const chartConfig = {
    online: {
      label: "Online Sales",
      color: "hsl(217, 91%, 60%)",
    },
    pos: {
      label: "POS Sales",
      color: "hsl(142, 76%, 36%)",
    },
    profit: {
      label: "Total Profit",
      color: "hsl(262, 83%, 58%)",
    },
  };

  // Helper function to format date based on period
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (period === "year") {
      // Calculate week number from start of year
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const daysSinceStart = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.floor(daysSinceStart / 7) + 1;
      return `W${weekNumber}`;
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Format sales by period data for the stacked bar chart
  const profitChartData = salesByPeriod?.map((item) => ({
    date: formatDate(item.date),
    online: Math.round(item.online),
    pos: Math.round(item.pos),
  })) || [];

  // Format total sales data with order counts
  const totalSalesData = salesByPeriod?.map((item) => ({
    date: formatDate(item.date),
    totalSales: Math.round(item.online + item.pos),
    onlineOrders: item.onlineOrders || 0,
    posSales: item.posSales || 0,
  })) || [];

  // Format product performance data
  const bestProductsData = productPerformance?.best.map((product) => ({
    name: product.name,
    sales: product.count,
  })) || [];

  const worstProductsData = productPerformance?.worst.map((product) => ({
    name: product.name,
    sales: product.count,
  })) || [];

  return (
    <div className="p-4 pt-0 space-y-6">
      {/* Time Period Selectors */}
      <div className="flex gap-2 flex-wrap">
        {(["today", "week", "month", "year", "all"] as TimePeriod[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            onClick={() => setPeriod(p)}
          >
            {PERIOD_LABELS[p]}
          </Button>
        ))}
      </div>

      {/* Total Sales Profit Stacked Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Total Sales (Pure Profit)</CardTitle>
          <CardDescription>
            {period === "year" ? "Weekly breakdown" : "Daily breakdown"} of online and POS sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profitChartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[400px]">
              <BarChart data={profitChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="online" stackId="a" fill="var(--color-online)" name="Online Sales" isAnimationActive={true} animationDuration={1000} />
                <Bar dataKey="pos" stackId="a" fill="var(--color-pos)" name="POS Sales" isAnimationActive={true} animationDuration={1000} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Sales with Order Counts */}
      <Card>
        <CardHeader>
          <CardTitle>Total Sales & Order Counts</CardTitle>
          <CardDescription>
            Total sales amount with number of online orders and POS sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalSalesData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[400px]">
              <BarChart data={totalSalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar yAxisId="left" dataKey="totalSales" fill="var(--color-profit)" name="Total Sales (DZD)" isAnimationActive={true} animationDuration={1000} />
                <Bar yAxisId="right" dataKey="onlineOrders" fill="var(--color-online)" name="Online Orders (count)" isAnimationActive={true} animationDuration={1000} />
                <Bar yAxisId="right" dataKey="posSales" fill="var(--color-pos)" name="POS Sales (count)" isAnimationActive={true} animationDuration={1000} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              No data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Best and Worst Performing Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Performing Products */}
        <Card>
          <CardHeader>
            <CardTitle>Best Performing Products (Top 3)</CardTitle>
            <CardDescription>
              Products with the highest sales in the selected time frame
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bestProductsData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={bestProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sales" fill="var(--color-online)" name="Sales Count" isAnimationActive={true} animationDuration={1000} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Worst Performing Products */}
        <Card>
          <CardHeader>
            <CardTitle>Worst Performing Products (Bottom 3)</CardTitle>
            <CardDescription>
              Products with the lowest sales (excluding unsold items)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {worstProductsData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <BarChart data={worstProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sales" fill="var(--color-pos)" name="Sales Count" isAnimationActive={true} animationDuration={1000} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
