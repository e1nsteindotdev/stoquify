import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LittleItem } from "@/components/ui/little-item";
import { useGetAnalytics } from "@/database/analytics";

export function RunningOutCard() {
  const analytics = useGetAnalytics({
    from: Date.now() - 30 * 24 * 60 * 60 * 1000,
    to: Date.now(),
    granularity: "day",
  });

  const { critical } = analytics.stockCover;

  const totalUnits = critical.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card id="running-out">
      <CardHeader>
        <div>
          <CardTitle>Running Out - Urgent Restock</CardTitle>
          <CardDescription>
            SKUs with less than 7 days of cover. Action needed immediately.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {critical.length === 0 ? (
          <div className="flex h-[150px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="text-3xl mb-2">✓</div>
              <div>All SKUs have sufficient stock cover</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-950/30 p-4">
              <div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {critical.length}
                </div>
                <div className="text-sm text-red-600/80 dark:text-red-400/80">
                  SKUs need restock
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {totalUnits}
                </div>
                <div className="text-sm text-red-600/80 dark:text-red-400/80">
                  Total units remaining
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {critical.map((item, idx) => (
                <div
                  key={`${item.productName}-${item.skuName}-${idx}`}
                  className="flex items-center justify-between rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-red-950/10 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold truncate">
                        {item.productName}
                      </span>
                      {item.skuName !== "Default" && (
                        <div className="flex gap-1">
                          {item.skuName.split(" / ").map((opt, i) => (
                            <LittleItem key={i}>{opt}</LittleItem>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600 dark:text-red-400">
                        {item.daysCover}d
                      </div>
                      <div className="text-xs text-muted-foreground">
                        cover left
                      </div>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <div className="font-medium">{item.quantity}</div>
                      <div className="text-xs text-muted-foreground">units</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
