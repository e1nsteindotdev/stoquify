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
          <CardTitle>Stock Cover (Days of Inventory)</CardTitle>
          <CardDescription>
            SKUs ordered by days of cover. Highlight: red &lt;7 days.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {critical.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No stock cover data available
          </div>
        ) : (
          <>
            {critical.length > 0 && (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    Critical: Less than 7 days ({critical.length} SKUs)
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
                        <div className="mt-1 h-2 w-full rounded-full bg-muted relative">
                          <div
                            className="h-full rounded-full bg-red-500 absolute top-0 left-0"
                            style={{
                              width: `${(Math.max(item.daysCover, 1) / maxDays) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="min-w-[80px] text-right">
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          {Math.max(item.daysCover, 1)} days
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {item.quantity} units
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
