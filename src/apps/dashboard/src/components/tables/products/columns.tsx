import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import type { ProductRow } from "@/livestore/schema/products/types";

export { ProductRow };

export const columns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: "imageUrl",
    header: "Image",
    cell: ({ row }) => (
      <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-md border border-input">
        {row.original.imageUrl ? (
          <img
            src={row.original.imageUrl}
            alt={row.original.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground uppercase">
            {row.original.title?.slice(0, 2)}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "title",
    header: "Titre",
  },
  {
    accessorKey: "price",
    header: "Prix",
    //  cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Link to="/produits/$slug" params={{ slug: row.original._id }}>
          <Button size="sm" variant="outline">
            Modifier
          </Button>
        </Link>
        <Button
          size="sm"
          variant="destructive"
          data-product-id={row.original._id}
        >
          Supprimer
        </Button>
      </div>
    ),
  },
];
