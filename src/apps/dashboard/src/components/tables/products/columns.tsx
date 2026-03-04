import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useGetIndexedDBImg } from "@/hooks/storage/get-indexeddb-img";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import type { ProductTableRow } from "@/database/products-table";
import { DataTableColumnHeader } from "../data-table-column-header";
import { PermissionGuard } from "@/components/permission-guard";

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDays = (days: number) => {
  if (days < 30) return `${days} jours`;
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  return `${months} mois ${remainingDays} jours`;
};

const SKU_OPTION_ORDER = ["Taille", "Couleur", "Pointure", "Size", "Color"];

const formatSkuOptionNames = (
  options?: ProductTableRow["skus"][number]["options"],
): string[] => {
  if (!options) return [];

  if (Array.isArray(options)) {
    return options
      .map((option, index) => {
        if (!option) return null;
        if (typeof option === "string") {
          return { label: option, order: index };
        }
        if (typeof option === "object") {
          const label = (option as any).optionName ?? option.name;
          if (!label) return null;
          const order = typeof option.order === "number" ? option.order : index;
          return { label, order };
        }
        return null;
      })
      .filter((item): item is { label: string; order: number } => item !== null)
      .sort((a, b) => a.order - b.order)
      .map((item) => item.label);
  }

  if (typeof options === "object") {
    const entries = Object.entries(options);
    entries.sort((a, b) => {
      const aIndex = SKU_OPTION_ORDER.findIndex(
        (o) => o.toLowerCase() === a[0].toLowerCase(),
      );
      const bIndex = SKU_OPTION_ORDER.findIndex(
        (o) => o.toLowerCase() === b[0].toLowerCase(),
      );
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    return entries.map(([, value]) => value);
  }

  return [];
};

const SkuOptionBadges = ({
  options,
  quantity,
}: {
  options?: ProductTableRow["skus"][number]["options"];
  quantity?: number;
}) => {
  const values = formatSkuOptionNames(options);
  const showQuantity = typeof quantity === "number";
  if (values.length === 0 && !showQuantity) return null;
  return (
    <div className="flex gap-1 flex-wrap items-center">
      {values.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="inline-flex items-center px-1.5 py-0.5 text-xs rounded border border-primary bg-primary/10 text-primary"
        >
          {value}
        </span>
      ))}
      {showQuantity && (
        <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-semibold rounded border border-primary bg-primary/10 text-primary">
          Qté: {quantity}
        </span>
      )}
    </div>
  );
};

const getDaysOfCoverColor = (days: number) => {
  if (days === Infinity || days > 20) return "text-green-600 bg-green-50";
  if (days >= 7) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};

export const columns: ColumnDef<ProductTableRow>[] = [
  {
    id: "expander",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      if (!row.original.skus.length) return null;
      return (
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      );
    },
  },
  {
    id: "product",
    header: "Produit",
    cell: ({ row }) => {
      const product = row.original;
      const imageUrl = product.imageUrl;
      const indexedDBId = product.indexedDBId;
      const url = indexedDBId
        ? (useGetIndexedDBImg(indexedDBId) ?? imageUrl)
        : imageUrl;

      return (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center overflow-hidden rounded-md border border-input">
            {url ? (
              <img
                src={url}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground uppercase">
                {product.title?.slice(0, 2)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex items-center gap-2">
            <div className="font-medium truncate max-w-[200px]">
              {product.title}
            </div>
            {product.sizeImbalance && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Déséquilibre de tailles détecté</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prix" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{formatMoney(row.original.price)}</span>
    ),
  },
  {
    accessorKey: "unitsSold",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Unités vendues" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.unitsSold.toLocaleString("fr-FR")}
      </span>
    ),
  },
  {
    accessorKey: "cost",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Coût" />
    ),
    cell: ({ row }) => {
      const { cost, margin } = row.original;
      return (
        <div>
          <div className="font-medium">{formatMoney(cost)}</div>
          {margin !== 0 && (
            <div className="text-xs text-muted-foreground">
              {margin.toFixed(1)}%
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "revenue",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Revenu" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{formatMoney(row.original.revenue)}</span>
    ),
  },
  {
    accessorKey: "profit",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bénéfice" />
    ),
    cell: ({ row }) => {
      const { profit } = row.original;
      return (
        <span
          className={cn(
            "font-medium",
            profit >= 0 ? "text-green-600" : "text-red-600",
          )}
        >
          {formatMoney(profit)}
        </span>
      );
    },
  },
  {
    accessorKey: "stockValue",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Valeur du stock" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {formatMoney(row.original.stockValue)}
      </span>
    ),
  },
  {
    id: "inventoryStatus",
    header: "État du stock",
    enableSorting: false,
    cell: ({ row }) => {
      const { totalQuantity, skus } = row.original;

      if (skus.length === 0) {
        return <span className="font-medium">{totalQuantity}</span>;
      }

      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-medium cursor-help underline decoration-dotted underline-offset-2">
                {totalQuantity}
              </span>
            </TooltipTrigger>
            <TooltipContent className="w-64">
              <div className="space-y-2 text-sm">
                <div className="font-medium">Détail des SKUs</div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {skus.map((sku) => (
                    <div key={sku._id} className="py-1">
                      <SkuOptionBadges
                        options={sku.options}
                        quantity={sku.quantity}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "sellThrough",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Taux de vente" />
    ),
    cell: ({ row }) => {
      const value = row.original.sellThrough;
      return (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                value > 70
                  ? "bg-green-500"
                  : value > 30
                    ? "bg-yellow-500"
                    : "bg-red-500",
              )}
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
          <span className="text-sm font-medium">{value.toFixed(1)}%</span>
        </div>
      );
    },
  },
  {
    accessorKey: "daysSinceLastSale",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Dernière vente" />
    ),
    cell: ({ row }) => {
      const days = row.original.daysSinceLastSale;
      if (days === null) {
        return <span className="text-muted-foreground">Jamais</span>;
      }
      return (
        <div className="flex items-center gap-1">
          <span>{days} jours</span>
          {days > 30 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pas de vente depuis plus de 30 jours</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "agingBand",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ancienneté" />
    ),
    cell: ({ row }) => {
      const days = row.original.agingBand;
      return <span>{formatDays(days)}</span>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <PermissionGuard resource="products" action="write">
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
        </PermissionGuard>
      </div>
    ),
  },
];

export const renderExpandedRow = ({ row }: { row: any }) => {
  const product = row.original;
  if (!product.skus.length) return null;

  return (
    <div className="p-4 bg-muted/30">
      <div className="font-medium mb-3">Détail des SKUs</div>
      <div className="grid gap-2">
        {product.skus.map((sku: any) => (
          <div
            key={sku._id}
            className="flex flex-col gap-2 bg-background p-3 rounded border"
          >
            <SkuOptionBadges options={sku.options} quantity={sku.quantity} />
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {sku.creationTime && (
                <div className="text-right">
                  <div className="text-muted-foreground">Créé le</div>
                  <div className="font-medium">
                    {new Date(sku.creationTime).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              )}
              {sku.cost !== undefined && (
                <div className="text-right">
                  <div className="text-muted-foreground">Coût</div>
                  <div className="font-medium">
                    {formatMoney(sku.cost * sku.quantity)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
