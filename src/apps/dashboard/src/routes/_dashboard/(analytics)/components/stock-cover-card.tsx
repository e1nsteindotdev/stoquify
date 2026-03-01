import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGetAnalytics } from "@/database/analytics";

export function StockCoverCard() {
  const analytics = useGetAnalytics({
    from: Date.now() - 30 * 24 * 60 * 60 * 1000,
    to: Date.now(),
    granularity: "day",
  });

  const { critical } = analytics.stockCover;

  const maxDays = Math.max(...critical.map((i) => i.daysCover), 1);

  return (
    <Card id="stock-cover">
      <CardHeader>
        <div>
          <CardTitle className="text-lg">Couverture de Stock (Jours)</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {critical.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            Aucune donnée de couverture de stock disponible
          </div>
        ) : (
          <>
            {critical.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-none bg-red-500" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Top 5 Critiques
                  </span>
                  <div className="h-3 w-3 rounded-none bg-orange-500 ml-2" />
                  <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    Autres critiques ({Math.max(0, critical.length - 5)} SKUs)
                  </span>
                </div>
                <div className="space-y-2">
                  {critical.map((item, idx) => (
                    <div
                      key={`${item.productName}-${item.skuName}-${idx}`}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">
                            {item.productName}
                          </span>
                          {item.skuName !== "Default" && (
                            <span className="text-sm text-muted-foreground">
                              {item.skuName}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 h-2 w-full rounded-none bg-gray-100 dark:bg-gray-800 relative">
                          <div
                            className={`h-full rounded-none absolute top-0 left-0 ${idx < 5 ? "bg-red-500" : "bg-orange-500"}`}
                            style={{
                              width: `${(Math.max(item.daysCover, 1) / maxDays) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="min-w-[80px] text-right">
                        <span
                          className={`text-sm font-bold ${idx < 5 ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`}
                        >
                          {Math.max(item.daysCover, 1)} jours
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {item.quantity} unités
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
