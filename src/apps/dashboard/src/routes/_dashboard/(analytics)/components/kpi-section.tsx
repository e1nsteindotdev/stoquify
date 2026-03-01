import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    onlineTransactions?: number;
    inSiteTransactions?: number;
  }> = [
    {
      label: "Revenu du jour",
      value: formatMoney(analytics.kpis.todayRevenue.value),
      rawValue: analytics.kpis.todayRevenue.value,
      change: analytics.kpis.todayRevenue.change,
      sparkline: analytics.kpis.todayRevenue.sparkline,
      color: COLORS.revenue,
      profit: analytics.kpis.todayProfit.value ?? 0,
    },
    {
      label: "Revenu du mois",
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
      onlineTransactions: analytics.kpis.transactions.online,
      inSiteTransactions: analytics.kpis.transactions.inSite,
    },
    {
      label: "Valeur totale du stock",
      value: formatMoney(analytics.kpis.inventoryValue.value),
      change: analytics.kpis.inventoryValue.change,
      sparkline: analytics.kpis.inventoryValue.sparkline,
      color: COLORS.categoryD,
      retailValue: analytics.kpis.inventoryRetailValue,
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Indicateurs clés de performance
        </h2>
        <DateController
          defaultPreset="thisMonth"
          onChange={(range) => setDateRange(range)}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <div className="flex items-center justify-start gap-3">
                    <CardTitle className="text-2xl leading-tight">
                      {kpi.value}
                    </CardTitle>
                    {kpi.change !== null && (
                      <Badge
                        variant={kpi.change >= 0 ? "default" : "destructive"}
                        className={`rounded-none px-1.5 py-0.5 text-xs font-semibold border ${
                          kpi.change >= 0
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
                        }`}
                      >
                        {kpi.change > 0 ? "+" : ""}
                        {formatPercent(kpi.change)}
                      </Badge>
                    )}
                  </div>
                  {kpi.profit !== undefined && (
                    <div className="mt-3 flex items-center gap-2 rounded-none bg-muted/50 p-1.5 px-2.5 w-max border-l-2 border-primary">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Profit
                      </span>
                      <span className="text-sm font-bold">
                        {formatMoney(kpi.profit)}
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground bg-background px-1 py-0.5 shadow-sm border border-border">
                        {((kpi.profit / (kpi.rawValue || 1)) * 100).toFixed(1)}%
                        marge
                      </span>
                    </div>
                  )}
                  {kpi.retailValue !== undefined && (
                    <div className="mt-3 flex items-center gap-2 rounded-none bg-muted/50 p-1.5 px-2.5 w-max border-l-2 border-primary">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Prix de vente
                      </span>
                      <span className="text-sm font-bold">
                        {formatMoney(kpi.retailValue)}
                      </span>
                    </div>
                  )}
                  {kpi.onlineTransactions !== undefined &&
                    kpi.inSiteTransactions !== undefined && (
                      <div className="mt-3 flex items-center gap-2 rounded-none bg-muted/50 p-1.5 px-2.5 w-max border-l-2 border-primary">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          En ligne
                        </span>
                        <span className="text-sm font-bold">
                          {kpi.onlineTransactions.toLocaleString("fr-FR")}
                        </span>
                        <div className="w-px h-3 bg-border mx-1"></div>
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Sur site
                        </span>
                        <span className="text-sm font-bold">
                          {kpi.inSiteTransactions.toLocaleString("fr-FR")}
                        </span>
                      </div>
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
