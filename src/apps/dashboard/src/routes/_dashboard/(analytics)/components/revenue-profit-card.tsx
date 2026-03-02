import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetAnalytics } from "@/database/analytics";
import {
  DateController,
  getPresetDates,
  type DateRange,
  type DatePreset,
} from "@/components/analytics/date-controller";

type ViewMode = "profit" | "revenue" | "both";

const getHatchPattern = () => {
  const svg = `<svg width="8" height="8" xmlns="http://www.w3.org/2000/svg"><path d="M0,8 L8,0 M-2,2 L2,-2 M6,10 L10,6" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.5"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

interface RevenueProfitCardProps {
  defaultPreset?: DatePreset;
}

export const formatYAxisValue = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  return value.toString();
};

export const formatBarValue = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toString();
};

export const formatAxisLabel = (
  timestamp: number,
  granularity: "day" | "week" | "2weeks" | "month",
) => {
  const date = new Date(timestamp);
  if (granularity === "day") {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  if (granularity === "week" || granularity === "2weeks") {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (granularity === "month") {
    return date.toLocaleDateString("en-US", { month: "short" });
  }
  return date.toLocaleDateString("en-US");
};

export function RevenueProfitCard({
  defaultPreset = "thisMonth",
}: RevenueProfitCardProps) {
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getPresetDates(defaultPreset),
  );
  const [preset, setPreset] = useState<DatePreset>(defaultPreset);
  const [viewMode, setViewMode] = useState<ViewMode>("revenue");

  const from = new Date(`${dateRange.from}T00:00:00+01:00`).getTime();
  const to = new Date(`${dateRange.to}T23:59:59+01:00`).getTime();
  const daysDiff = (to - from) / (1000 * 60 * 60 * 24);

  let granularity: "day" | "week" | "2weeks" | "month" = "day";
  if (preset === "thisYear" || preset === "lastYear" || daysDiff > 180) {
    granularity = "2weeks";
  } else {
    granularity = "day";
  }

  const analytics = useGetAnalytics({ from, to, granularity });

  const chartSeries = analytics.revenueProfitSeries.map((point) => ({
    ...point,
    label: formatAxisLabel(point.timestamp, granularity),
  }));

  const activeDataKey = viewMode === "profit" ? "profit" : "revenue";

  const rawMaxValue = Math.max(
    ...chartSeries.map((d) =>
      viewMode === "both" ? Math.max(d.revenue, d.profit) : d[activeDataKey],
    ),
    1,
  );

  // Add 15% padding to the top for the labels to fit
  const maxValue = rawMaxValue * 1.15;

  const yAxisTicks = [
    maxValue,
    maxValue * 0.75,
    maxValue * 0.5,
    maxValue * 0.25,
    0,
  ];

  return (
    <Card id="revenue-profit" className="overflow-hidden relative bg-card">
      <style>{`
        @keyframes growUp {
          from { transform: scaleY(0); transform-origin: bottom; }
          to { transform: scaleY(1); transform-origin: bottom; }
        }
        .animate-grow-up {
          animation: growUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fade-in {
          animation: fadeIn 0.4s ease-in 0.4s forwards;
          opacity: 0;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <CardHeader className="relative z-10 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Revenu et Profit</CardTitle>
          </div>

          <div className="flex flex-col items-end gap-3 z-20 sm:flex-row sm:items-center">
            <div className="flex border bg-muted/50 p-1">
              <Button
                type="button"
                variant={viewMode === "revenue" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs rounded-none"
                onClick={() => setViewMode("revenue")}
              >
                Revenu
              </Button>
              <Button
                type="button"
                variant={viewMode === "profit" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs rounded-none"
                onClick={() => setViewMode("profit")}
              >
                Profit
              </Button>
              <Button
                type="button"
                variant={viewMode === "both" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs rounded-none"
                onClick={() => setViewMode("both")}
              >
                Les deux
              </Button>
            </div>
            <DateController
              defaultPreset={defaultPreset}
              onChange={(range, newPreset) => {
                setDateRange(range);
                setPreset(newPreset);
              }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 pb-6 pt-2">
        {/* Chart Area */}
        {chartSeries.length > 0 ? (
          <div className="h-[280px] w-full flex mt-4 group">
            {/* Y Axis */}
            <div className="flex flex-col justify-between pr-4 pb-6 text-sm text-muted-foreground w-14 flex-shrink-0">
              {yAxisTicks.map((tick, i) => (
                <div
                  key={i}
                  className="flex items-center justify-end w-full h-0 relative"
                >
                  <span className="absolute -translate-y-1/2 bg-card px-1 z-10">
                    {formatYAxisValue(tick)}
                  </span>
                  {/* Horizontal grid lines */}
                  <div className="absolute left-full w-[calc(100vw-6rem)] border-b border-dashed border-border/50" />
                </div>
              ))}
            </div>

            {/* Bars Area */}
            <div className="flex-1 flex items-end justify-between gap-1 pb-6 relative">
              {chartSeries.map((d, i) => {
                const revPercent =
                  maxValue > 0 ? (d.revenue / maxValue) * 100 : 0;
                const profPercent =
                  maxValue > 0 ? (d.profit / maxValue) * 100 : 0;
                const isBoth = viewMode === "both";

                return (
                  <div
                    key={i}
                    className="relative flex-1 flex items-end justify-center group/bar h-full gap-1"
                  >
                    {/* Revenue Bar */}
                    {(isBoth || viewMode === "revenue") && (
                      <div
                        className="w-full relative flex-1 animate-grow-up flex items-end justify-center"
                        style={{
                          height: `${Math.max(revPercent, 1)}%`,
                          animationDelay: `${i * 30}ms`,
                          animationFillMode: "both",
                        }}
                      >
                        {/* Bar Value Label */}
                        <div className="absolute -top-5 text-xs font-medium text-foreground fade-in whitespace-nowrap">
                          {d.revenue > 0 ? formatBarValue(d.revenue) : ""}
                        </div>
                        {/* Solid Bar */}
                        <div
                          className="w-full h-full rounded-t-[2px] border-2 border-primary bg-background/5"
                          style={{
                            color: "hsl(var(--primary))",
                            backgroundImage: getHatchPattern(),
                          }}
                        />
                      </div>
                    )}

                    {/* Profit Bar */}
                    {(isBoth || viewMode === "profit") && (
                      <div
                        className="w-full relative flex-1 animate-grow-up flex items-end justify-center"
                        style={{
                          height: `${Math.max(profPercent, 1)}%`,
                          animationDelay: `${isBoth ? i * 30 + 15 : i * 30}ms`,
                          animationFillMode: "both",
                        }}
                      >
                        {/* Bar Value Label */}
                        <div className="absolute -top-5 text-xs font-medium text-foreground fade-in whitespace-nowrap">
                          {d.profit > 0 ? formatBarValue(d.profit) : ""}
                        </div>
                        {/* Solid Bar */}
                        <div
                          className="w-full h-full rounded-t-[2px] border-2 bg-background/5"
                          style={{
                            color: isBoth
                              ? "hsl(var(--chart-2))"
                              : "hsl(var(--primary))",
                            borderColor: isBoth
                              ? "hsl(var(--chart-2))"
                              : "hsl(var(--primary))",
                            backgroundImage: getHatchPattern(),
                          }}
                        />
                      </div>
                    )}

                    {/* X Axis Label */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {chartSeries.length > 14 && i % 2 !== 0 ? "" : d.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex h-[240px] items-center justify-center text-muted-foreground text-sm">
            Aucune donnée disponible pour la période sélectionnée
          </div>
        )}
      </CardContent>
    </Card>
  );
}
