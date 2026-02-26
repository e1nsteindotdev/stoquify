import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useGetIndexedDBImg } from "@/hooks/storage/get-indexeddb-img";

export type ProductRow = {
  _id: string;
  title: string;
  price: number;
  imageUrl?: string;
  indexedDBId?: number;
};

export const columns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: "imageUrl",
    header: "Image",
    cell: ({ row }) => {
      const imageUrl = row.original.imageUrl;
      const indexedDBId = row.original.indexedDBId;
      const url = indexedDBId
        ? (useGetIndexedDBImg(indexedDBId) ?? imageUrl)
        : imageUrl;

      return (
        <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-md border border-input">
          {url ? (
            <img
              src={url}
              alt={row.original.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground uppercase">
              {row.original.title?.slice(0, 2)}
            </div>
          )}
        </div>
      );
    },
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
