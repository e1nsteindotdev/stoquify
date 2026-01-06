import { createFileRoute } from "@tanstack/react-router";
import { StorageUsage } from "@/components/debug/storage-usage";
import { ClearStorage } from "@/components/debug/clear-storage";

export const Route = createFileRoute("/debug")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Debug Tools</h1>
          <p className="text-muted-foreground">
            Manage and troubleshoot local storage for this application.
          </p>
        </div>

        <StorageUsage />

        <ClearStorage />
      </div>
    </div>
  );
}
