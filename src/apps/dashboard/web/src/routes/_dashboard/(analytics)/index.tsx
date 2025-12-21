import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "api/convex";
import { useState } from "react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";

type TimePeriod = "today" | "week" | "month" | "year" | "all";

const PERIOD_LABELS: Record<TimePeriod, string> = {
  today: "Aujourd'hui",
  week: "Cette semaine",
  month: "Ce mois",
  year: "Cette année",
  all: "Tout",
};

export const Route = createFileRoute("/_dashboard/(analytics)/")({
  component: Page,
});

function Page() {
  const [period, setPeriod] = useState<TimePeriod>("today");

  const salesData = useQuery(api.analytics.getSalesData, { period });
  const salesByPeriod = useQuery(api.analytics.getSalesByTimePeriod, { period });
  const productPerformance = useQuery(api.analytics.getProductPerformance, { period });

  const chartConfig = {
    online: {
      label: "Ventes en ligne",
      color: "hsl(217, 91%, 60%)",
    },
    pos: {
      label: "Ventes POS",
      color: "hsl(142, 76%, 36%)",
    },
    profit: {
      label: "Bénéfice total",
      color: "hsl(262, 83%, 58%)",
    },
    totalCount: {
      label: "Volume de ventes",
      color: "hsl(262, 83%, 58%)",
    },
  };

  // Helper function to format date based on period
  const formatDate = (dateString: string) => {
    if (period === "all") {
      const [year, month] = dateString.split("-");
      const d = new Date(parseInt(year), parseInt(month) - 1);
      return d.toLocaleDateString("fr-FR", {
        month: "short",
        year: "2-digit",
      });
    }
    const date = new Date(dateString);
    if (period === "year") {
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const daysSinceStart = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
      const weekNumber = Math.floor(daysSinceStart / 7) + 1;
      return `S${weekNumber}`;
    }
    return date.toLocaleDateString("fr-FR", {
      month: "short",
      day: "numeric",
    });
  };

  // Format sales by period data for the stacked bar chart
  const profitChartData = salesByPeriod?.map((item) => ({
    date: formatDate(item.date),
    online: Math.round(item.online),
    pos: Math.round(item.pos),
  })) || [];

  // Format total sales data with order counts
  const totalSalesData = salesByPeriod?.map((item) => ({
    date: formatDate(item.date),
    totalCount: (item.onlineOrders || 0) + (item.posSales || 0),
    onlineOrders: item.onlineOrders || 0,
    posSales: item.posSales || 0,
  })) || [];

  // Format product performance data
  const bestProductsData = productPerformance?.best.map((product) => ({
    name: product.name,
    sales: product.count,
  })) || [];

  const worstProductsData = productPerformance?.worst.map((product) => ({
    name: product.name,
    sales: product.count,
  })) || [];

  return (
    <div className="p-4 pt-0 space-y-6">
      {/* Time Period Selectors */}
      <div className="flex gap-2 flex-wrap">
        {(["today", "week", "month", "year", "all"] as TimePeriod[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            onClick={() => setPeriod(p)}
          >
            {PERIOD_LABELS[p]}
          </Button>
        ))}
      </div>

      {/* Total Sales Profit Stacked Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ventes Totales (Bénéfice Pur)</CardTitle>
            <CardDescription>
              {period === "all" ? "Répartition mensuelle" : period === "year" ? "Répartition hebdomadaire" : "Répartition quotidienne"} des ventes en ligne et POS
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profitChartData.length > 0 ? (
              <div className="overflow-x-auto">
                <ChartContainer config={chartConfig} className="h-[400px] min-w-[600px]">
                  <BarChart data={profitChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="online" stackId="a" fill="var(--color-online)" name="Ventes en ligne" isAnimationActive={true} animationDuration={1000} />
                    <Bar dataKey="pos" stackId="a" fill="var(--color-pos)" name="Ventes POS" isAnimationActive={true} animationDuration={1000} />
                  </BarChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible pour la période sélectionnée
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-center">
          <CardHeader>
            <CardTitle>Récapitulatif</CardTitle>
            <CardDescription>Période: {PERIOD_LABELS[period]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground uppercase">Bénéfice Total</p>
              <p className="text-2xl font-bold">{(salesData?.totalProfit || 0).toLocaleString()} DZD</p>
            </div>
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">En ligne:</span>
                <span className="font-semibold">{(salesData?.onlineProfit || 0).toLocaleString()} DZD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">POS:</span>
                <span className="font-semibold">{(salesData?.posProfit || 0).toLocaleString()} DZD</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total Sales with Order Counts - Curve Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Nombre de ventes (Commandes + POS)</CardTitle>
            <CardDescription>
              {period === "all" ? "Evolution mensuelle" : "Evolution des ventes"} au fil du temps
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalSalesData.length > 0 ? (
              <div className="overflow-x-auto">
                <ChartContainer config={chartConfig} className="h-[400px] min-w-[600px]">
                  <LineChart data={totalSalesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="totalCount" 
                      stroke="var(--color-totalCount)" 
                      strokeWidth={3}
                      name="Ventes totales" 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      isAnimationActive={true} 
                      animationDuration={1000} 
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible pour la période sélectionnée
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-center">
          <CardHeader>
            <CardTitle>Ventes effectuées</CardTitle>
            <CardDescription>Période: {PERIOD_LABELS[period]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground uppercase">Total Ventes</p>
              <p className="text-2xl font-bold">{(salesData?.orderCount || 0) + (salesData?.saleCount || 0)}</p>
            </div>
            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Commandes en ligne:</span>
                <span className="font-semibold">{salesData?.orderCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ventes POS:</span>
                <span className="font-semibold">{salesData?.saleCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best and Worst Performing Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Performing Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produits les plus performants (Top 3)</CardTitle>
            <CardDescription>
              Produits ayant réalisé les ventes les plus élevées au cours de la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bestProductsData.length > 0 ? (
              <div className="overflow-x-auto">
                <ChartContainer config={chartConfig} className="h-[300px] min-w-[500px]">
                  <BarChart data={bestProductsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sales" fill="var(--color-online)" name="Nombre de ventes" isAnimationActive={true} animationDuration={1000} />
                  </BarChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Worst Performing Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produits les moins performants (Derniers 3)</CardTitle>
            <CardDescription>
              Produits ayant réalisé les ventes les plus faibles (à l'exclusion des articles non vendus)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {worstProductsData.length > 0 ? (
              <div className="overflow-x-auto">
                <ChartContainer config={chartConfig} className="h-[300px] min-w-[500px]">
                  <BarChart data={worstProductsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="sales" fill="var(--color-pos)" name="Nombre de ventes" isAnimationActive={true} animationDuration={1000} />
                  </BarChart>
                </ChartContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
