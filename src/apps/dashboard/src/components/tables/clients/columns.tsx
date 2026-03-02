import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

export type ClientRow = {
  _id: string;
  name: string;
  phoneNumber: number;
  address: string;
  orderCount: number;
};

export const columns: ColumnDef<ClientRow>[] = [
  {
    accessorKey: "name",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nom" />
    ),
  },
  {
    accessorKey: "phoneNumber",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Téléphone" />
    ),
  },
  {
    accessorKey: "address",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Adresse" />
    ),
  },
  {
    accessorKey: "orderCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Commandes" />
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Link to="/clients/$slug" params={{ slug: row.original._id }}>
          <Button size="sm" variant="outline">
            Voir
          </Button>
        </Link>
      </div>
    ),
  },
];
