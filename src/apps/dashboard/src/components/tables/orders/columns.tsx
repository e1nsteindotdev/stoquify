import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";

export type OrderRow = {
  _id: string;
  customerName: string;
  phoneNumber: number;
  totalCost: number;
  status: "pending" | "confirmed" | "denied";
  createdAt: number;
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
};

const statusLabels = {
  pending: "En attente",
  confirmed: "Confirmée",
  denied: "Refusée",
};

export const columns: ColumnDef<OrderRow>[] = [
  {
    accessorKey: "customerName",
    header: "Client",
  },
  {
    accessorKey: "phoneNumber",
    header: "Téléphone",
  },
  {
    accessorKey: "totalCost",
    header: "Total",
    cell: ({ row }) => `${row.original.totalCost} DA`,
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => (
      <Badge className={statusColors[row.original.status]}>
        {statusLabels[row.original.status]}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Link to="/commandes/$slug" params={{ slug: row.original._id }}>
          <Button size="sm" variant="outline">
            Voir
          </Button>
        </Link>
      </div>
    ),
  },
];

