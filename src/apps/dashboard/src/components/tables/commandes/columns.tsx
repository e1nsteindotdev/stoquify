import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Trash2, ChevronDown, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { salesCollection } from "@/database/sales";
import { useState } from "react";
import { PermissionGuard } from "@/components/permission-guard";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { convex } from "@/lib/convex-client";
import { api } from "api/convex";
import { useMutation } from "@tanstack/react-query";
import type { Id } from "api/data-model";

export type CommandeRow = {
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

export const columns: ColumnDef<CommandeRow>[] = [
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
      const confirmCommande = useMutation({
        mutationFn: (saleId: string) =>
          convex.mutation(api.sales.confirm, { saleId: saleId as Id<"sales"> }),
      });
      const denyCommande = useMutation({
        mutationFn: (saleId: string) =>
          convex.mutation(api.sales.deny, { saleId: saleId as Id<"sales"> }),
      });
      const currentStatus = row.original.status;
      const [isLoading, setIsLoading] = useState(false);

      const handleStatusChange = async (newStatus: "confirmed" | "denied") => {
        setIsLoading(true);
        try {
          if (newStatus === "confirmed") {
            const result = await confirmCommande.mutateAsync(row.original._id);
            if (result.ok) {
              toast.success("Commande confirmée");
            } else if (result.error === "stock_not_sufficient") {
              const items = result.insufficientStockItems || [];
              const errorMessage = items
                .map(
                  (item) =>
                    `SKU ${item.skuId}: demandé ${item.requested}, disponible ${item.available}`,
                )
                .join(", ");
              toast.error(`Stock insuffisant: ${errorMessage}`);
            } else {
              toast.error(result.error || "Erreur lors de la confirmation");
            }
          } else {
            await denyCommande.mutateAsync(row.original._id);
            toast.success("Commande refusée");
          }

          const storeId = useAppStore.getState().selectedStore?._id;
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["sales", storeId] }),
          ]);

          await salesCollection.preload();
        } catch (error) {
          toast.error("Une erreur est survenue");
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <PermissionGuard
          resource="sales"
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
      const removeCommande = useMutation({
        mutationFn: (saleId: string) =>
          convex.mutation(api.sales.remove, { saleId: saleId as Id<"sales"> }),
      });
      const handleRemove = async () => {
        if (confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
          try {
            await removeCommande.mutateAsync(row.original._id);
            const storeId = useAppStore.getState().selectedStore?._id;
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["sales", storeId] }),
            ]);
            await salesCollection.preload();
            toast.success("Commande supprimée");
          } catch (error) {
            toast.error("Erreur lors de la suppression");
          }
        }
      };
      return (
        <div className="flex gap-2">
          <Link to="/commandes/$slug" params={{ slug: row.original._id }}>
            <Button size="sm" variant="outline" className="rounded-none">
              Voir
            </Button>
          </Link>
          <PermissionGuard resource="sales" action="write">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemove}
              disabled={removeCommande.isPending}
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
