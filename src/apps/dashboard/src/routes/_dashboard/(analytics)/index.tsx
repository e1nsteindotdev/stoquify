import { useTransition, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KPISection } from "./components/kpi-section";
import { RevenueProfitCard } from "./components/revenue-profit-card";
import { TopProductsCard } from "./components/top-products-card";
import { DeadStockCard } from "./components/dead-stock-card";
import { CategoryPerformanceCard } from "./components/category-performance-card";
import { HeatmapCard } from "./components/heatmap-card";
import { StockCoverCard } from "./components/stock-cover-card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_dashboard/(analytics)/")({
  loader: () => {
    // salesCollection.preload();
  },
  component: Page,
});

function Page() {
  const [, startTransition] = useTransition();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    startTransition(() => setShowContent(true));
  }, []);

  if (!showContent) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytiques</h1>
          <p className="text-sm text-muted-foreground">
            Vue d'ensemble des performances de votre activité.
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

function AnalyticsSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
