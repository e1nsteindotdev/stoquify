import { useState, useMemo, useDeferredValue } from "react";
import { columns } from "./columns";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@tanstack/react-router";
import { ClipLoader } from "react-spinners";
import { convex } from "@/lib/convex-client";
import { api } from "api/convex";
import { queryClient } from "@/lib/ts-query-client";
import {
  useGetProductTableData,
  filterProducts,
  type FilterChip,
} from "@/database/products-table";
import {
  DateController,
  getPresetDates,
  type DateRange,
} from "@/components/analytics/date-controller";
import { cn } from "@/lib/utils";
import {
  Filter,
  TrendingUp,
  AlertTriangle,
  Clock,
  Percent,
  Search,
  X,
  Loader2,
} from "lucide-react";
import Fuse from "fuse.js";
import { useDebounce } from "use-debounce";
import { PermissionGuard } from "@/components/permission-guard";

const filterChipConfig: {
  id: FilterChip;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "highPerformers",
    label: "Performants",
    icon: <TrendingUp className="w-3 h-3" />,
  },
  {
    id: "lowStock",
    label: "Stock faible",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  { id: "deadStock", label: "Stock mort", icon: <Clock className="w-3 h-3" /> },
  {
    id: "lowMargin",
    label: "Marge faible",
    icon: <Percent className="w-3 h-3" />,
  },
];

export function ProductsTable() {
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getPresetDates("thisMonth"),
  );
  const [activeFilters, setActiveFilters] = useState<FilterChip[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 150);

  const from = new Date(`${dateRange.from}T00:00:00+01:00`).getTime();
  const to = new Date(`${dateRange.to}T23:59:59+01:00`).getTime();

  const products = useGetProductTableData(from, to);

  const deferredQuery = useDeferredValue(debouncedQuery);
  const isSearchStale = searchQuery !== deferredQuery;

  const fuse = useMemo(() => {
    return new Fuse(products, {
      keys: ["title"],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (deferredQuery.trim()) {
      const startTime = performance.now();
      const results = fuse.search(deferredQuery);
      const searchTime = performance.now() - startTime;
      console.log(
        `[Search Performance] Query: "${deferredQuery}" | Results: ${results.length} | Time: ${searchTime.toFixed(2)}ms`,
      );
      return results.map((result) => result.item);
    }
    return filterProducts(products, activeFilters);
  }, [products, activeFilters, deferredQuery, fuse]);

  const toggleFilter = (filter: FilterChip) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter],
    );
  };

  const onClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const button = target.closest(
      "button[data-product-id]",
    ) as HTMLButtonElement | null;
    if (button) {
      const id = button.getAttribute("data-product-id") as any;
      await convex.mutation(api.products.deleteProduct, { id });
      queryClient.refetchQueries({ queryKey: ["products"] });
    }
  };

  const isLoading = !products;

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <ClipLoader color="#000" size={50} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-4" onClick={onClick}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produits</h1>
          <p className="text-sm text-muted-foreground">
            Gérez votre inventaire et consultez les performances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PermissionGuard resource="products" action="write">
            <Link to="/produits/create">
              <Button variant="default">Nouveau produit</Button>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isSearchStale && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Recherche en cours...</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Filtres:</span>
        </div>
        {filterChipConfig.map((config) => (
          <Button
            key={config.id}
            variant={activeFilters.includes(config.id) ? "default" : "outline"}
            size="sm"
            className={cn(
              "gap-1",
              activeFilters.includes(config.id) &&
                "bg-blue-600 hover:bg-blue-700",
            )}
            onClick={() => toggleFilter(config.id)}
            disabled={!!deferredQuery.trim()}
          >
            {config.icon}
            {config.label}
          </Button>
        ))}
        {activeFilters.length > 0 && !deferredQuery.trim() && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveFilters([])}
          >
            Effacer
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {filteredProducts.length} produit
        {filteredProducts.length !== 1 ? "s" : ""}
        {deferredQuery.trim()
          ? ` (recherche: "${deferredQuery}")`
          : activeFilters.length > 0 &&
            ` (filtré${activeFilters.length !== 1 ? "s" : ""})`}
      </div>

      <div className="flex w-full justify-end">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Afficher les données uniquement pour cette période :
          </span>
          <DateController
            defaultPreset="thisMonth"
            onChange={(range) => setDateRange(range)}
          />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun produit trouvé</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {deferredQuery.trim()
              ? `Aucun produit ne correspond à "${deferredQuery}"`
              : "Aucun produit ne correspond aux filtres sélectionnés"}
          </p>
          {deferredQuery.trim() && (
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Effacer la recherche
            </Button>
          )}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredProducts} />
      )}
    </div>
  );
}
