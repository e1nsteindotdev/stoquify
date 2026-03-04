import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAppStore } from "@/lib/store";
import { hasGlobalPermission } from "@/lib/permissions";
import { EmployeesTable } from "@/components/tables/employees/table";
import { useTransition, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_dashboard/employes/")({
  loader: () => {
    const user = useAppStore.getState().user;
    if (!hasGlobalPermission(user, "employees", "read")) {
      throw redirect({ to: "/" });
    }
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
        {showTable ? <EmployeesTable /> : <TableSkeleton />}
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
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-4 w-32" />
      <div className="border rounded-md">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full border-t" />
        ))}
      </div>
    </div>
  );
}
