import { columns, type ProductRow } from "./columns";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ClipLoader } from "react-spinners";
import { useStore } from "@livestore/react";
import { products$ } from "@/livestore/schema/products";
import { events } from "@/livestore/schema";
import { wrapQuery } from "@/lib/error-logger";

export function ProductsTable() {
  const { store } = useStore();
  const productsResult = wrapQuery(
    () => store.useQuery(products$()),
    "productsWithDetailsAndVariants-all",
    "ProductsTable",
  );
  const products = productsResult ?? null;
  const isLoading = productsResult === undefined;

  const rows: ProductRow[] | undefined = products?.map((p) => {
    const firstImage = p.images
      ?.filter((img) => !img.hidden && img.url)
      .sort((a, b) => a.displayOrder - b.displayOrder)[0];
    return {
      _id: p.id,
      title: p.title,
      price: p.price,
      imageUrl: firstImage?.url,
      indexedDBId: firstImage?.indexedDBId,
    };
  });

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

  if (productsResult === null) {
    return (
      <div className="container mx-auto py-10 text-center text-red-500">
        Unable to load products. Please refresh the page.
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
      {rows && <DataTable columns={columns} data={rows} />}
    </div>
  );
}
