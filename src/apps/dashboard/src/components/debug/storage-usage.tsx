import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StorageCard } from "./storage-card";
import {
  getStorageSummary,
  StorageSummary,
  formatBytes,
} from "@/lib/storage-utils";
import { IconRefresh } from "@tabler/icons-react";

export function StorageUsage() {
  const [summary, setSummary] = useState<StorageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStorage = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStorageSummary();
      setSummary(data);
    } catch (err) {
      setError("Failed to load storage information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorage();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <p className="text-muted-foreground">
              {error || "No data available"}
            </p>
            <button
              onClick={fetchStorage}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <IconRefresh className="h-4 w-4" />
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercent =
    summary.total.quota > 0
      ? Math.round((summary.total.usage / summary.total.quota) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Storage Usage</CardTitle>
          <button
            onClick={fetchStorage}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Refresh storage information"
          >
            <IconRefresh className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total usage</span>
              <span className="font-medium">
                {formatBytes(summary.total.usage)} /{" "}
                {formatBytes(summary.total.quota)}
              </span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {usagePercent}% used
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StorageCard
          title="OPFS"
          size={summary.opfs.size}
          count={summary.opfs.fileCount}
          icon="opfs"
          supported={summary.opfs.supported}
        />
        <StorageCard
          title="IndexedDB"
          count={summary.indexedDB.databaseCount}
          icon="indexeddb"
          supported={summary.indexedDB.supported}
        />
        <StorageCard
          title="localStorage"
          size={summary.localStorage.size}
          count={summary.localStorage.keyCount}
          icon="localstorage"
          supported={summary.localStorage.supported}
        />
        <StorageCard
          title="Cache API"
          count={summary.cacheAPI.cacheCount}
          icon="cache"
          supported={summary.cacheAPI.supported}
        />
      </div>
    </div>
  );
}
