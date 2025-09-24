import { ProductsTable } from "@/components/tables/products/table";
import { createFileRoute } from "@tanstack/react-router";

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
