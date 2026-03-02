import { type AnalyticsGranularity } from "@/database/analytics";

export const COLORS = {
  revenue: "hsl(221, 83%, 53%)",
  profit: "hsl(142, 71%, 45%)",
  dead30: "hsl(43, 96%, 56%)",
  dead60: "hsl(24, 95%, 53%)",
  dead90: "hsl(0, 84%, 60%)",
  categoryA: "hsl(221, 83%, 53%)",
  categoryB: "hsl(173, 58%, 39%)",
  categoryC: "hsl(262, 80%, 55%)",
  categoryD: "hsl(32, 95%, 44%)",
  categoryE: "hsl(346, 77%, 49%)",
};

export const granularityOptions: Array<{
  label: string;
  value: AnalyticsGranularity;
}> = [
  { label: "Daily", value: "day" },
  { label: "Weekly", value: "week" },
  { label: "Monthly", value: "month" },
];

export const formatMoney = (value: number) =>
  `${Math.round(value).toLocaleString("fr-FR")} DZD`;

export const formatPercent = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "--";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${Math.round(value)}%`;
};

export const formatSeriesLabel = (
  timestamp: number,
  granularity: AnalyticsGranularity,
) => {
  const date = new Date(timestamp);
  if (granularity === "month") {
    return date.toLocaleDateString("fr-FR", {
      month: "short",
      year: "2-digit",
    });
  }
  if (granularity === "week") {
    const end = new Date(timestamp + 6 * 24 * 60 * 60 * 1000);
    return `${date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} - ${end.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}`;
  }
  if (granularity === "2weeks") {
    const end = new Date(timestamp + 13 * 24 * 60 * 60 * 1000);
    return `${date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} - ${end.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}`;
  }
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
};
