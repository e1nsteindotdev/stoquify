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

export function TopProductsCard() {
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getPresetDates("thisMonth"),
  );
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const from = new Date(`${dateRange.from}T00:00:00+01:00`).getTime();
  const to = new Date(`${dateRange.to}T23:59:59+01:00`).getTime();

  const analytics = useGetAnalytics({ from, to, granularity: "day" });

  const totalUnits = analytics.topProducts.reduce(
    (sum, p) => sum + p.unitsSold,
    0,
  );

  const topProducts = analytics.topProducts.map((product) => ({
    name: product.name,
    unitsSold: product.unitsSold,
    percentage: totalUnits > 0 ? (product.unitsSold / totalUnits) * 100 : 0,
    revenue: product.revenue,
    profit: product.profit,
    margin: product.margin,
  }));

  const maxPercentage = Math.max(...topProducts.map((p) => p.percentage), 1);

  return (
    <Card id="top-products">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Top 10 Produits</CardTitle>
          </div>
          <DateController
            defaultPreset="thisMonth"
            onChange={(range) => setDateRange(range)}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {topProducts.length > 0 ? (
          <div className="space-y-3">
            {topProducts.map((product) => (
              <div key={product.name} className="group relative">
                <div className="flex items-center gap-3">
                  <div className="w-[180px] truncate text-sm font-medium">
                    {product.name}
                  </div>
                  <div className="flex-1">
                    <div className="relative h-6 w-full rounded-none bg-stone-200">
                      <div
                        className="absolute inset-y-0 left-0 rounded-none bg-primary"
                        style={{
                          width: `${(product.percentage / maxPercentage) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="min-w-[100px] text-right text-sm font-medium">
                    {product.unitsSold.toLocaleString("fr-FR")} (
                    {product.percentage.toFixed(1)}%)
                  </div>
                </div>
                <div
                  className="absolute left-0 top-full z-10 mt-2 hidden w-[200px] rounded-lg border border-border/50 bg-background p-3 shadow-xl group-hover:block"
                  onMouseEnter={() => setHoveredProduct(product.name)}
                  onMouseLeave={() => setHoveredProduct(null)}
                >
                  <div className="text-sm font-medium">{product.name}</div>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenu</span>
                      <span className="font-medium">
                        {formatMoney(product.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit</span>
                      <span className="font-medium">
                        {formatMoney(product.profit)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Marge</span>
                      <span className="font-medium">
                        {product.margin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-[220px] items-center justify-center text-muted-foreground">
            Aucune donnée de performance produit
          </div>
        )}
      </CardContent>
    </Card>
  );
}
