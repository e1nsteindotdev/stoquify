import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetAnalytics } from "@/database/analytics";
import {
  DateController,
  getPresetDates,
  type DateRange,
} from "@/components/analytics/date-controller";
import { formatMoney } from "../utils";

export function DeadStockCard() {
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getPresetDates("thisMonth"),
  );

  const from = new Date(`${dateRange.from}T00:00:00+01:00`).getTime();
  const to = new Date(`${dateRange.to}T23:59:59+01:00`).getTime();

  const analytics = useGetAnalytics({ from, to, granularity: "day" });

  return (
    <Card id="dead-stock" className="flex flex-col min-h-[500px] rounded-none">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Stock Dormant</CardTitle>
          </div>
          <DateController
            defaultPreset="thisMonth"
            onChange={(range) => setDateRange(range)}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
          {analytics.deadStock.buckets
            .filter((b) => !b.label.includes("30"))
            .map((bucket) => {
              const totalValue = bucket.skus.reduce(
                (sum, s) => sum + s.value,
                0,
              );

              return (
                <Card
                  key={bucket.label}
                  className="flex flex-col overflow-hidden bg-muted/30 border-0 shadow-none ring-1 ring-inset ring-border rounded-none py-0 gap-0"
                >
                  <div className="py-2 px-4 bg-muted/50 border-b flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-foreground">
                        {bucket.label}
                      </h3>
                      <span className="text-base font-semibold text-muted-foreground">
                        {bucket.skus.length} SKUs
                      </span>
                    </div>
                    <div className="text-base font-medium text-muted-foreground">
                      Valeur totale:{" "}
                      <span className="font-bold text-foreground">
                        {formatMoney(totalValue)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 h-[300px] overflow-y-auto">
                    <div className="p-4 space-y-4">
                      {bucket.skus.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          Aucun stock dormant
                        </p>
                      ) : (
                        bucket.skus.slice(0, 5).map((sku, i) => (
                          <div
                            key={i}
                            className="flex flex-col gap-2 p-4 py-3 rounded-none border bg-background text-sm"
                          >
                            <div className="flex flex-col gap-1">
                              <span className="font-medium leading-tight text-[16px]">
                                {sku.productName}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {sku.skuName !== "Default"
                                  ? sku.skuName
                                  : "Produit standard"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0 mt-2 pt-3 border-t">
                              <div className="flex justify-between items-center">
                                <span className="text-[14px] text-black/90 uppercase tracking-wider">
                                  En stock
                                </span>
                                <span className="font-medium text-[14px]">
                                  {sku.quantity}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[14px] text-black/90 uppercase tracking-wider">
                                  Valeur Morte
                                </span>
                                <span className="font-medium text-[14px]">
                                  {formatMoney(sku.value)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[14px] text-black/90 uppercase tracking-wider">
                                  Profit Global
                                </span>
                                <span
                                  className={`font-medium text-[14px] ${sku.profitability >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-destructive"}`}
                                >
                                  {sku.profitability > 0 ? "+" : ""}
                                  {formatMoney(sku.profitability)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
