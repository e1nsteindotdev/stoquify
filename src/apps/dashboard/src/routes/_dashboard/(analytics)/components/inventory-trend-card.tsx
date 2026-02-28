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
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  CartesianGrid,
  Line,
  LineChart,
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
import { COLORS, formatSeriesLabel, granularityOptions } from "../utils";

const chartConfig = {
  inventory: { label: "Inventory Value", color: COLORS.profit },
};

export function InventoryTrendCard() {
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getPresetDates("thisMonth"),
  );
  const granularity = granularityOptions[0].value;

  const from = new Date(`${dateRange.from}T00:00:00+01:00`).getTime();
  const to = new Date(`${dateRange.to}T23:59:59+01:00`).getTime();

  const analytics = useGetAnalytics({ from, to, granularity });

  return (
    <Card id="inventory-trend">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Inventory Value Trend</CardTitle>
            <CardDescription>
              Inventory value over time based on selected granularity.
            </CardDescription>
          </div>
          <DateController
            defaultPreset="thisMonth"
            onChange={(range) => setDateRange(range)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {analytics.inventoryTrend.length > 0 ? (
          <div className="overflow-x-auto">
            <ChartContainer
              config={chartConfig}
              className="h-[320px] min-w-[700px]"
            >
              <LineChart
                data={analytics.inventoryTrend.map((point) => ({
                  ...point,
                  label: formatSeriesLabel(point.timestamp, granularity),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-inventory)"
                  strokeWidth={3}
                  dot={false}
                  name="Inventory Value"
                />
              </LineChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="flex h-[260px] items-center justify-center text-muted-foreground">
            No inventory trend data
          </div>
        )}
      </CardContent>
    </Card>
  );
}
