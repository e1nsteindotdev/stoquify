import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DataTableColumnHeader } from "../data-table-column-header";
import type { ExpenseWithCategory } from "@/database/expenses";
import type { ExpenseCategory } from "@/database/expense-categories";
import { PermissionGuard } from "@/components/permission-guard";

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

export const getColumns = (
  categories: ExpenseCategory[],
): ColumnDef<ExpenseWithCategory>[] => [
  {
    accessorKey: "date",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{formatDate(row.original.date)}</span>
    ),
  },
  {
    accessorKey: "title",
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Titre"
        explanation="Nom ou description courte de la dépense"
      />
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
    accessorFn: (row) => row.category?.name,
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Catégorie"
        explanation="Classification de la dépense pour le suivi"
        isChoice
        choices={categories.map((c) => ({ label: c.name, value: c.name }))}
      />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
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
    enableSorting: true,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title="Coût"
        explanation="Montant total de la dépense effectuée"
      />
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
      <div className="flex gap-2">
        <PermissionGuard resource="expenses" action="write">
          <Button
            size="sm"
            variant="outline"
            data-expense-id={row.original._id}
            data-action="edit"
          >
            Modifier
          </Button>
          <Button
            size="sm"
            variant="destructive"
            data-expense-id={row.original._id}
            data-action="delete"
          >
            Supprimer
          </Button>
        </PermissionGuard>
      </div>
    ),
  },
];
