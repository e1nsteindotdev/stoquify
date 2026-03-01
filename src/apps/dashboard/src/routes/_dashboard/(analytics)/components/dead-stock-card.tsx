import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { useGetAnalytics } from "@/database/analytics";
import {
  DateController,
  getPresetDates,
  type DateRange,
} from "@/components/analytics/date-controller";
import { COLORS, formatMoney } from "../utils";

const chartConfig = {
  dead30: { label: "30+ days", color: COLORS.dead30 },
  dead60: { label: "60+ days", color: COLORS.dead60 },
  dead90: { label: "90+ days", color: COLORS.dead90 },
};

export function DeadStockCard() {
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getPresetDates("thisMonth"),
  );

  const from = new Date(`${dateRange.from}T00:00:00+01:00`).getTime();
  const to = new Date(`${dateRange.to}T23:59:59+01:00`).getTime();

  const analytics = useGetAnalytics({ from, to, granularity: "day" });

  return (
    <Card id="dead-stock">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Stock Dormant</CardTitle>
          </div>
          <DateController
            defaultPreset="thisMonth"
            onChange={(range) => setDateRange(range)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <ChartContainer config={chartConfig} className="h-[260px]">
          <BarChart
            data={[
              {
                name: "Stock Dormant",
                dead30: analytics.deadStock.buckets[0]?.value ?? 0,
                dead60: analytics.deadStock.buckets[1]?.value ?? 0,
                dead90: analytics.deadStock.buckets[2]?.value ?? 0,
              },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="dead30"
              stackId="dead"
              fill="var(--color-dead30)"
              name="30+ days"
            />
            <Bar
              dataKey="dead60"
              stackId="dead"
              fill="var(--color-dead60)"
              name="60+ days"
            />
            <Bar
              dataKey="dead90"
              stackId="dead"
              fill="var(--color-dead90)"
              name="90+ days"
            />
          </BarChart>
        </ChartContainer>
        <div className="grid grid-cols-3 gap-2 text-sm">
          {analytics.deadStock.buckets.map((bucket) => (
            <div key={bucket.label} className="rounded-md border p-2">
              <p className="text-muted-foreground">{bucket.label}</p>
              <p className="font-semibold">{bucket.count} SKUs</p>
              <p>{formatMoney(bucket.value)}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Valeur totale du stock dormant :{" "}
          {formatMoney(analytics.deadStock.totalValue)}
        </p>
      </CardContent>
    </Card>
  );
}
