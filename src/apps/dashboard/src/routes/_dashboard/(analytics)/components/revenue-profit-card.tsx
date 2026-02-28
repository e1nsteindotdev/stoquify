import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

type ViewMode = "profit" | "revenue" | "both";

const chartConfig = {
  revenue: { label: "Revenue", color: COLORS.revenue },
  profit: { label: "Profit", color: COLORS.profit },
};

interface RevenueProfitCardProps {
  defaultPreset?: "thisMonth" | "today";
}

export function RevenueProfitCard({
  defaultPreset = "thisMonth",
}: RevenueProfitCardProps) {
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getPresetDates(defaultPreset),
  );
  const [viewMode, setViewMode] = useState<ViewMode>("profit");
  const granularity = granularityOptions[0].value;

  const from = new Date(`${dateRange.from}T00:00:00+01:00`).getTime();
  const to = new Date(`${dateRange.to}T23:59:59+01:00`).getTime();

  const analytics = useGetAnalytics({ from, to, granularity });

  const chartSeries = analytics.revenueProfitSeries.map((point) => ({
    ...point,
    label: formatSeriesLabel(point.timestamp, granularity),
  }));

  return (
    <Card id="revenue-profit">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Revenue & Profit Over Time</CardTitle>
            <CardDescription>
              Dual-axis trend by selected time granularity.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-input bg-transparent p-1">
              <Button
                type="button"
                variant={viewMode === "revenue" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("revenue")}
              >
                Revenue
              </Button>
              <Button
                type="button"
                variant={viewMode === "profit" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("profit")}
              >
                Profit
              </Button>
              <Button
                type="button"
                variant={viewMode === "both" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("both")}
              >
                Both
              </Button>
            </div>
            <DateController
              defaultPreset={defaultPreset}
              onChange={(range) => setDateRange(range)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartSeries.length > 0 ? (
          <div className="overflow-x-auto">
            <ChartContainer
              config={chartConfig}
              className="h-[380px] min-w-[700px]"
            >
              <LineChart data={chartSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="left" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  style={{
                    visibility: viewMode === "both" ? "visible" : "hidden",
                  }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={3}
                  dot={false}
                  name="Revenue"
                  style={{
                    visibility:
                      viewMode === "both" || viewMode === "revenue"
                        ? "visible"
                        : "hidden",
                  }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="profit"
                  stroke="var(--color-profit)"
                  strokeWidth={3}
                  dot={false}
                  name="Profit"
                  style={{
                    visibility:
                      viewMode === "both" || viewMode === "profit"
                        ? "visible"
                        : "hidden",
                  }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        ) : (
          <div className="flex h-[320px] items-center justify-center text-muted-foreground">
            No data available for selected range
          </div>
        )}
      </CardContent>
    </Card>
  );
}
