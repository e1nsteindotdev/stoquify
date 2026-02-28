import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResponsiveContainer, Line, LineChart, Tooltip } from "recharts";
import { useGetAnalytics } from "@/database/analytics";
import {
  DateController,
  getPresetDates,
  type DateRange,
} from "@/components/analytics/date-controller";
import { COLORS, formatMoney, formatPercent } from "../utils";

const Sparkline = ({
  points,
  color,
}: {
  points: Array<{ label: string; value: number }>;
  color: string;
}) => {
  const data = points.slice(-12);
  return (
    <div className="h-14 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <Tooltip
            formatter={(value: number) => value.toLocaleString("fr-FR")}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export function KPISection() {
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getPresetDates("thisMonth"),
  );

  const from = new Date(`${dateRange.from}T00:00:00+01:00`).getTime();
  const to = new Date(`${dateRange.to}T23:59:59+01:00`).getTime();

  const analytics = useGetAnalytics({ from, to, granularity: "day" });

  const kpiItems: Array<{
    label: string;
    value: string | number;
    rawValue?: number;
    change: number | null;
    sparkline: Array<{ label: string; value: number }>;
    color: string;
    profit?: number;
    profitChange?: number;
    profitSparkline?: Array<{ label: string; value: number }>;
    showSparkline?: boolean;
    retailValue?: number;
  }> = [
    {
      label: "Today Revenue",
      value: formatMoney(analytics.kpis.todayRevenue.value),
      rawValue: analytics.kpis.todayRevenue.value,
      change: analytics.kpis.todayRevenue.change,
      sparkline: analytics.kpis.todayRevenue.sparkline,
      color: COLORS.revenue,
      profit: analytics.kpis.todayProfit.value ?? 0,
    },
    {
      label: "This Month Revenue",
      value: formatMoney(analytics.kpis.monthRevenue.value),
      rawValue: analytics.kpis.monthRevenue.value,
      change: analytics.kpis.monthRevenue.change,
      sparkline: analytics.kpis.monthRevenue.sparkline,
      color: COLORS.revenue,
      profit: analytics.kpis.monthProfit.value ?? 0,
    },
    {
      label: "Transactions",
      value: analytics.kpis.transactions.value.toLocaleString("fr-FR"),
      change: analytics.kpis.transactions.change,
      sparkline: analytics.kpis.transactions.sparkline,
      color: COLORS.categoryB,
    },
    {
      label: "Total Inventory Value",
      value: formatMoney(analytics.kpis.inventoryValue.value),
      change: null,
      sparkline: [],
      color: COLORS.categoryD,
      showSparkline: false,
      retailValue: analytics.kpis.inventoryRetailValue,
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Key Performance Indicators</h2>
        <DateController
          defaultPreset="thisMonth"
          onChange={(range) => setDateRange(range)}
        />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {kpiItems.map((kpi) => (
          <Card
            key={kpi.label}
            className="cursor-pointer transition hover:border-primary/50 py-4"
          >
            <CardHeader className="pb-2 space-y-1">
              <CardDescription className="text-base font-semibold opacity-100">
                {kpi.label}
              </CardDescription>
              <div className="flex items-end justify-between">
                <div className="flex-1">
                  <div className="flex items-baseline justify-start gap-2">
                    <CardTitle className="text-2xl leading-tight">
                      {kpi.value}
                    </CardTitle>
                    <span
                      className={`text-sm ${
                        kpi.change === null
                          ? "text-muted-foreground"
                          : kpi.change >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                      }`}
                    >
                      {kpi.change !== null ? formatPercent(kpi.change) : ""}
                    </span>
                  </div>
                  {kpi.profit !== undefined && (
                    <p className="text-xs text-black">
                      Profit: {formatMoney(kpi.profit)} (
                      {((kpi.profit / (kpi.rawValue || 1)) * 100).toFixed(1)}%)
                    </p>
                  )}
                  {kpi.retailValue !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      At retail: {formatMoney(kpi.retailValue)}
                    </p>
                  )}
                </div>
                <div className="w-20">
                  {kpi.showSparkline !== false && (
                    <Sparkline points={kpi.sparkline} color={kpi.color} />
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
