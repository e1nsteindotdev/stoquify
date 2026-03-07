import { createFileRoute } from "@tanstack/react-router";
import { CommandesTable } from "@/components/tables/commandes/table";
import { salesCollection } from "@/database/sales";
import { useTransition, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_dashboard/commandes/")({
  loader: () => {
    salesCollection.preload();
  },
  component: Page,
});

function Page() {
  const [, startTransition] = useTransition();
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    startTransition(() => setShowTable(true));
  }, []);

  return (
    <div className="p-4 pt-0 w-full h-full flex flex-col gap-4">
      <div className="flex-1">
        {showTable ? <CommandesTable /> : <TableSkeleton />}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
