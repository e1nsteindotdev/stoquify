import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IconTrash } from "@tabler/icons-react";
import { clearAllStorage, ClearStorageResult } from "@/lib/storage-utils";

export function ClearStorage() {
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<ClearStorageResult | null>(null);

  const handleClear = async () => {
    setClearing(true);
    try {
      const clearResult = await clearAllStorage();
      setResult(clearResult);

      if (clearResult.success) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      setResult({
        success: false,
        opfs: false,
        indexedDB: false,
        localStorage: false,
        cacheAPI: false,
        errors: ["An unexpected error occurred"],
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card className="border-red-200 dark:border-red-900/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <IconTrash className="h-5 w-5" />
          Clear Storage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This will permanently delete all locally stored data including OPFS,
          IndexedDB, localStorage, and Cache API. This action cannot be undone.
        </p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <IconTrash className="h-4 w-4" />
              Clear All Storage
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Clear All Storage?</DialogTitle>
              <DialogDescription>
                This will permanently delete all locally stored data for this
                site. The application will reload after clearing. This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>

            {result && (
              <div className="py-4 space-y-2">
                {result.success ? (
                  <p className="text-green-600 text-sm">
                    ✓ Storage cleared successfully! Reloading...
                  </p>
                ) : (
                  <>
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">Results:</p>
                      <ul className="list-disc list-inside text-muted-foreground">
                        <li
                          className={
                            result.opfs ? "text-green-600" : "text-red-600"
                          }
                        >
                          OPFS: {result.opfs ? "✓ Cleared" : "✗ Failed"}
                        </li>
                        <li
                          className={
                            result.indexedDB ? "text-green-600" : "text-red-600"
                          }
                        >
                          IndexedDB:{" "}
                          {result.indexedDB ? "✓ Cleared" : "✗ Failed"}
                        </li>
                        <li
                          className={
                            result.localStorage
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          localStorage:{" "}
                          {result.localStorage ? "✓ Cleared" : "✗ Failed"}
                        </li>
                        <li
                          className={
                            result.cacheAPI ? "text-green-600" : "text-red-600"
                          }
                        >
                          Cache API:{" "}
                          {result.cacheAPI ? "✓ Cleared" : "✗ Failed"}
                        </li>
                      </ul>
                    </div>
                    {result.errors.length > 0 && (
                      <div className="text-red-600 text-sm">
                        Errors: {result.errors.join(", ")}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <DialogFooter>
              {!result?.success && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={clearing}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleClear}
                    disabled={clearing}
                  >
                    {clearing ? "Clearing..." : "Clear Storage"}
                  </Button>
                </>
              )}
              {result?.success && (
                <Button
                  variant="default"
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Reload Now
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
