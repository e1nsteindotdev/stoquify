import { columns, type ProductRow } from "./columns";
import { DataTable } from "@/components/tables/data-table";
import { useGetProducts } from "@/database/products";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ClipLoader } from "react-spinners";
import { convex } from "@/lib/convex-client";
import { api } from "api/convex";
import { queryClient } from "@/lib/ts-query-client";

export function ProductsTable() {
  const productsResult = useGetProducts();
  const products = productsResult?.data ?? [];
  const isLoading = !productsResult?.isEnabled;

  const rows: ProductRow[] = products.map((p: any) => {
    const firstImage = p.images
      ?.filter((img: any) => !img.hidden && img.url)
      .sort((a: any, b: any) => a.order - b.order)[0];
    return {
      _id: p._id,
      title: p.title,
      price: p.price,
      imageUrl: firstImage?.url,
      indexedDBId: firstImage?.indexedDBId,
    };
  });

  const onClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const button = target.closest(
      "button[data-product-id]",
    ) as HTMLButtonElement | null;
    if (button) {
      const id = button.getAttribute("data-product-id") as any;
      await convex.mutation(api.products.deleteProduct, { id })
      queryClient.refetchQueries({ queryKey: ['products'] })
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
