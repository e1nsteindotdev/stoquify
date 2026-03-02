import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "../data-table-column-header";
import type { ExpenseWithCategory } from "@/database/expenses";

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const columns: ColumnDef<ExpenseWithCategory>[] = [
  {
    accessorKey: "date",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{formatDate(row.original.date)}</span>
    ),
  },
  {
    id: "title",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Titre" />
    ),
    cell: ({ row }) => (
      <div className="min-w-0">
        <div className="font-medium truncate max-w-[200px]">
          {row.original.title}
        </div>
        {row.original.description && (
          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
            {row.original.description}
          </div>
        )}
      </div>
    ),
  },
  {
    id: "category",
    enableSorting: false,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Catégorie" />
    ),
    cell: ({ row }) => {
      const category = row.original.category;
      return category ? (
        <span className="inline-flex items-center px-2 py-1 text-xs rounded border border-primary/20 bg-primary/5">
          {category.name}
        </span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
  },
  {
    accessorKey: "cost",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Coût" />
    ),
    cell: ({ row }) => (
      <span className="font-medium text-red-600">
        -{formatMoney(row.original.cost)}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
          size="sm"
          variant="destructive"
          data-expense-id={row.original._id}
        >
          Supprimer
        </Button>
      </div>
    ),
  },
];
