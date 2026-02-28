import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { KPISection } from "./components/kpi-section";
import { RevenueProfitCard } from "./components/revenue-profit-card";
import { TopProductsCard } from "./components/top-products-card";
import { DeadStockCard } from "./components/dead-stock-card";
import { CategoryPerformanceCard } from "./components/category-performance-card";
import { HeatmapCard } from "./components/heatmap-card";
import { StockCoverCard } from "./components/stock-cover-card";

export const Route = createFileRoute("/_dashboard/(analytics)/")({
  component: Page,
});

function Page() {
  return (
    <div className="p-4 pt-0 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Decision-focused overview of sales, profit, and inventory health.
          </p>
        </div>
      </div>

      <KPISection />

      <RevenueProfitCard />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TopProductsCard />
        <CategoryPerformanceCard />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DeadStockCard />
        <StockCoverCard />
      </div>

      <HeatmapCard />
    </div>
  );
}
