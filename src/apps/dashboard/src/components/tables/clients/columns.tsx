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
  lastOrderDate: string | null;
  totalRevenue: number;
  totalProfit: number;
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
      <DataTableColumnHeader
        column={column}
        title="Commandes"
        explanation="Nombre total de commandes passées par ce client"
      />
    ),
  },
  {
    accessorKey: "lastOrderDate",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Dernière commande"
        explanation="Date de la transaction la plus récente"
      />
    ),
    cell: ({ row }) => {
      const date = row.original.lastOrderDate;
      return date ? new Date(date).toLocaleDateString("fr-FR") : "-";
    },
  },
  {
    accessorKey: "totalRevenue",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Revenu"
        explanation="Somme totale des achats effectués par ce client"
      />
    ),
    cell: ({ row }) => {
      const revenue = row.original.totalRevenue;
      return `${revenue.toLocaleString("fr-FR")} DA`;
    },
  },
  {
    accessorKey: "totalProfit",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Bénéfice"
        explanation="Marge nette totale réalisée grâce à ce client"
      />
    ),
    cell: ({ row }) => {
      const profit = row.original.totalProfit;
      return `${profit.toLocaleString("fr-FR")} DA`;
    },
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
