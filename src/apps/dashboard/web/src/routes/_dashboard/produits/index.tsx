import { ProductsTable } from "@/components/tables/products/table";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_dashboard/produits/")({
  component: Page,
});

function Page() {
  return (
    <div className="p-4 pt-0 w-full h-full flex flex-col gap-4">
      <div className="flex-1">
        <ProductsTable />
      </div>
    </div>
  );
}
