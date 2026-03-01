import { createFileRoute } from "@tanstack/react-router";
import { ClientsTable } from "@/components/tables/clients/table";
import { customersCollection } from "@/database/customers";
import { useTransition, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_dashboard/clients/")({
  loader: () => {
    customersCollection.preload();
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
        {showTable ? <ClientsTable /> : <TableSkeleton />}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-4 w-20" />
      <div className="border rounded-md">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-14 w-full border-t" />
        ))}
      </div>
    </div>
  );
}
