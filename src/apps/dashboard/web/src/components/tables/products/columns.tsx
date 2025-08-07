import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export type ProductRow = {
  _id: string;
  title: string;
  desc: string;
  price: number;
};

export const columns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "desc",
    header: "Description",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Link to="/produits/$slug" params={{ slug: row.original._id }}>
          <Button size="sm" variant="outline">
            Edit
          </Button>
        </Link>
        <Button
          size="sm"
          variant="destructive"
          data-product-id={row.original._id}
        >
          Delete
        </Button>
      </div>
    ),
  },
];
