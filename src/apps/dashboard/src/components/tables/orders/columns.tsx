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
import { Trash2, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ordersCollection } from "@/database/orders";
import { salesCollection } from "@/database/sales";
import { useState } from "react";
import { PermissionGuard } from "@/components/permission-guard";

export type OrderRow = {
  _id: string;
  customerName: string;
  phoneNumber: number;
  totalCost: number;
  status: "pending" | "confirmed" | "denied";
  createdAt: string | number;
  source?: "online" | "in_store";
  itemCount: number;
  profit: number;
  customerOrderCount: number;
};

const statusColors = {
  pending: {
    base: "bg-amber-200 text-amber-900 border-amber-300",
    hover: "hover:bg-amber-300 hover:text-amber-950",
  },
  confirmed: {
    base: "bg-emerald-200 text-emerald-900 border-emerald-300",
    hover: "hover:bg-emerald-300 hover:text-emerald-950",
  },
  denied: {
    base: "bg-rose-200 text-rose-900 border-rose-300",
    hover: "hover:bg-rose-300 hover:text-rose-950",
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
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Client"
        explanation="Nom du client ayant passé la commande"
      />
    ),
  },
  {
    accessorKey: "createdAt",
    enableSorting: true,
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
    accessorKey: "phoneNumber",
    enableSorting: false,
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
      <DataTableColumnHeader
        column={column}
        title="Bénéfice"
        explanation="Marge nette générée par cette commande"
      />
    ),
    cell: ({ row }) => `${row.original.profit} DA`,
  },
  {
    accessorKey: "itemCount",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Articles"
        explanation="Nombre total d'articles dans cette commande"
      />
    ),
    cell: ({ row }) => row.original.itemCount,
  },
  {
    accessorKey: "customerOrderCount",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Commandes client"
        explanation="Nombre total de commandes passées par ce client"
      />
    ),
    cell: ({ row }) => row.original.customerOrderCount,
  },
  {
    accessorKey: "status",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Statut"
        explanation="État actuel du traitement de la commande"
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
      const [isLoading, setIsLoading] = useState(false);

      const handleStatusChange = async (newStatus: "confirmed" | "denied") => {
        setIsLoading(true);
        try {
          if (newStatus === "confirmed") {
            await confirmOrder.mutateAsync({
              orderId: row.original._id as any,
            });
            await salesCollection.preload();
          } else {
            await denyOrder.mutateAsync({ orderId: row.original._id as any });
            await ordersCollection.preload();
          }
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <PermissionGuard
          resource="orders"
          action="write"
          fallback={
            <Badge
              className={`${statusColors[currentStatus].base} rounded-none border px-3 py-1 text-xs font-semibold`}
            >
              {statusLabels[currentStatus]}
            </Badge>
          }
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Badge
                className={`${statusColors[currentStatus].base} ${statusColors[currentStatus].hover} cursor-pointer rounded-none border px-3 py-1 text-xs font-semibold transition-colors`}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    {statusLabels[currentStatus]}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </>
                )}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() => handleStatusChange("confirmed")}
                disabled={currentStatus === "confirmed" || isLoading}
              >
                <span className="text-green-600 mr-2">●</span>
                Confirmée
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange("denied")}
                disabled={currentStatus === "denied" || isLoading}
              >
                <span className="text-red-600 mr-2">●</span>
                Refusée
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGuard>
      );
    },
  },
  {
    accessorKey: "source",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Source"
        explanation="Canal d'origine de la commande"
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
      <span className="text-black uppercase">
        {row.original.source === "online" ? "EN LIGNE" : "EN MAGASIN"}
      </span>
    ),
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
          <PermissionGuard resource="orders" action="write">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteOrder.isPending}
              className="rounded-none"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </PermissionGuard>
        </div>
      );
    },
  },
];
