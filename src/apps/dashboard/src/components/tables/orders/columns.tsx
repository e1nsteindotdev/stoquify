import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import {
  useDeleteOrder,
  useConfirmOrder,
  useDenyOrder,
} from "@/hooks/use-convex-queries";
import { Trash2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type OrderRow = {
  _id: string;
  customerName: string;
  phoneNumber: number;
  totalCost: number;
  status: "pending" | "confirmed" | "denied";
  createdAt: number;
  source?: "online" | "in_store";
  itemCount: number;
  profit: number;
  customerOrderCount: number;
};

const statusColors = {
  pending: {
    base: "bg-yellow-100 text-yellow-800 border-yellow-200",
    hover: "hover:bg-yellow-200 hover:text-yellow-900",
  },
  confirmed: {
    base: "bg-green-100 text-green-800 border-green-200",
    hover: "hover:bg-green-200 hover:text-green-900",
  },
  denied: {
    base: "bg-red-100 text-red-800 border-red-200",
    hover: "hover:bg-red-200 hover:text-red-900",
  },
};

const statusLabels = {
  pending: "En attente",
  confirmed: "Confirmée",
  denied: "Refusée",
};

export const columns: ColumnDef<OrderRow>[] = [
  {
    accessorKey: "customerName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Client" />
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Téléphone" />
    ),
  },
  {
    accessorKey: "totalCost",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => `${row.original.totalCost} DA`,
  },
  {
    accessorKey: "profit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bénéfice" />
    ),
    cell: ({ row }) => `${row.original.profit} DA`,
  },
  {
    accessorKey: "itemCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Articles" />
    ),
    cell: ({ row }) => row.original.itemCount,
  },
  {
    accessorKey: "customerOrderCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Commandes client" />
    ),
    cell: ({ row }) => row.original.customerOrderCount,
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Statut"
        isChoice
        choices={[
          { label: "En attente", value: "pending" },
          { label: "Confirmée", value: "confirmed" },
          { label: "Refusée", value: "denied" },
        ]}
      />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    cell: ({ row }) => {
      const confirmOrder = useConfirmOrder();
      const denyOrder = useDenyOrder();
      const currentStatus = row.original.status;

      const handleStatusChange = async (newStatus: "confirmed" | "denied") => {
        if (newStatus === "confirmed") {
          await confirmOrder.mutateAsync({ orderId: row.original._id as any });
        } else {
          await denyOrder.mutateAsync({ orderId: row.original._id as any });
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Badge
              className={`${statusColors[currentStatus].base} ${statusColors[currentStatus].hover} cursor-pointer rounded-none border px-3 py-1 text-xs font-semibold transition-colors`}
            >
              {statusLabels[currentStatus]}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => handleStatusChange("confirmed")}
              disabled={currentStatus === "confirmed" || confirmOrder.isPending}
            >
              <span className="text-green-600 mr-2">●</span>
              Confirmée
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("denied")}
              disabled={currentStatus === "denied" || denyOrder.isPending}
            >
              <span className="text-red-600 mr-2">●</span>
              Refusée
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
  {
    accessorKey: "source",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Source"
        isChoice
        choices={[
          { label: "En ligne", value: "online" },
          { label: "En magasin", value: "in_store" },
        ]}
      />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    cell: ({ row }) => (
      <Badge
        variant={row.original.source === "online" ? "default" : "secondary"}
        className="rounded-md"
      >
        {row.original.source === "online" ? "En ligne" : "En magasin"}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
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
    cell: ({ row }) => {
      const deleteOrder = useDeleteOrder();
      const handleDelete = async () => {
        if (confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
          await deleteOrder.mutateAsync({ orderId: row.original._id as any });
        }
      };
      return (
        <div className="flex gap-2">
          <Link to="/commandes/$slug" params={{ slug: row.original._id }}>
            <Button size="sm" variant="outline" className="rounded-none">
              Voir
            </Button>
          </Link>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteOrder.isPending}
            className="rounded-none"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
