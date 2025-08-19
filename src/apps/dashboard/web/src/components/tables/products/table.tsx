import { columns, type ProductRow } from "./columns";
import { DataTable } from "@/components/tables/data-table";
import { useQuery, useMutation } from "convex/react";
import { api } from "api/convex";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export function ProductsTable() {
  const products = useQuery(api.products.listProduts) ?? [];
  const deleteProduct = useMutation(api.products.removeProduct);

  const rows: ProductRow[] = products.map((p: any) => ({
    _id: p._id,
    title: p.title,
    desc: p.desc,
    price: p.price,
  }));

  const onClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const button = target.closest(
      "button[data-product-id]"
    ) as HTMLButtonElement | null;
    if (button) {
      const id = button.getAttribute("data-product-id") as any;
      await deleteProduct({ id });
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-4" onClick={onClick}>
      <div className="flex justify-end">
        <Link to="/produits/create">
          <Button variant="default">New Product</Button>
        </Link>
      </div>
      <DataTable columns={columns} data={rows} />
    </div>
  );
}
