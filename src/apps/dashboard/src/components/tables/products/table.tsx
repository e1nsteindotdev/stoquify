import { columns, type ProductRow } from "./columns";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ClipLoader } from "react-spinners";
import { useStore } from "@livestore/react";
import { products$ } from "@/livestore/schema/products";
import { events } from "@/livestore/schema";

export function ProductsTable() {
  const { store } = useStore();
  const productsResult = store.useQuery(products$());
  const products = productsResult ?? [];
  const isLoading = productsResult === undefined;

  const rows: ProductRow[] = products.map((p) => ({
    _id: p.id,
    title: p.title,
    price: p.price,
    imageUrl: p.images
      ?.filter((img) => !img.hidden && img.url)
      .sort((a, b) => a.order - b.order)[0]?.url,
  }));

  const onClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const button = target.closest(
      "button[data-product-id]",
    ) as HTMLButtonElement | null;
    if (button) {
      const id = button.getAttribute("data-product-id");
      if (id) {
        store.commit(events.productDeleted({ id, deletedAt: new Date() }));
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <ClipLoader color="#000" size={50} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 space-y-4" onClick={onClick}>
      <div className="flex justify-end">
        <Link to="/produits/create">
          <Button variant="default">Nouveau produit</Button>
        </Link>
      </div>
      <DataTable columns={columns} data={rows} />
    </div>
  );
}
