import { columns, type OrderRow } from "./columns";
import { DataTable } from "@/components/tables/data-table";
import { useGetOrders } from "@/database/orders";
import { ClipLoader } from "react-spinners";
import { useState, useMemo, useDeferredValue } from "react";
import {
  DateController,
  getPresetDates,
  type DateRange,
} from "@/components/analytics/date-controller";
import { Input } from "@/components/ui/input";
import { Search, X, Loader2 } from "lucide-react";
import Fuse from "fuse.js";
import { useDebounce } from "use-debounce";

export function OrdersTable() {
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getPresetDates("thisMonth"),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 150);

  const ordersResult = useGetOrders();
  const orders = ordersResult?.data ?? [];
  const isLoading = !ordersResult?.isEnabled;

  const rows: OrderRow[] = orders.map((order: any) => ({
    _id: order._id,
    customerName: order.customer
      ? `${order.customer.firstName} ${order.customer.lastName}`
      : "N/A",
    phoneNumber: order.customer?.phoneNumber ?? 0,
    totalCost: order.subTotalCost + order.deliveryCost,
    status: order.status,
    createdAt: order.createdAt,
    source: order.source,
    itemCount: order.itemCount || 0,
    profit: order.profit || 0,
    customerOrderCount: order.customerOrderCount || 0,
  }));

  const deferredQuery = useDeferredValue(debouncedQuery);
  const isSearchStale = searchQuery !== deferredQuery;

  const fuse = useMemo(() => {
    return new Fuse(rows, {
      keys: ["customerName"],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (deferredQuery.trim()) {
      const startTime = performance.now();
      const results = fuse.search(deferredQuery);
      const searchTime = performance.now() - startTime;
      console.log(
        `[Orders Search] Query: "${deferredQuery}" | Results: ${results.length} | Time: ${searchTime.toFixed(2)}ms`,
      );
      return results.map((result) => result.item);
    }
    return rows;
  }, [rows, deferredQuery, fuse]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <ClipLoader color="#000" size={50} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commandes</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos commandes et suivez les performances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateController
            defaultPreset="thisMonth"
            onChange={(range) => setDateRange(range)}
          />
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un client..."
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

      <div className="text-sm text-muted-foreground">
        {filteredRows.length} commande{filteredRows.length !== 1 ? "s" : ""}
        {deferredQuery.trim() && ` (recherche: "${deferredQuery}")`}
      </div>

      {filteredRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Aucune commande trouvée
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {deferredQuery.trim()
              ? `Aucune commande ne correspond à "${deferredQuery}"`
              : "Aucune commande disponible"}
          </p>
          {deferredQuery.trim() && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredRows} />
      )}
    </div>
  );
}
