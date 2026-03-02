import { columns, type ClientRow } from "./columns";
import { DataTable } from "@/components/tables/data-table";
import { useGetCustomers } from "@/database/customers";
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

export function ClientsTable() {
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    getPresetDates("thisMonth"),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 150);

  const clientsResult = useGetCustomers();
  const clients = clientsResult?.data ?? [];

  const rows: ClientRow[] = clients.map((client: any) => ({
    _id: client._id,
    name: `${client.firstName} ${client.lastName}`,
    phoneNumber: client.phoneNumber,
    address: client.address
      ? `${client.address.address}, ${client.address.wilaya?.htmlName || ""}`
      : "N/A",
    orderCount: client.orderCount || 0,
  }));

  const deferredQuery = useDeferredValue(debouncedQuery);
  const isSearchStale = searchQuery !== deferredQuery;

  const fuse = useMemo(() => {
    return new Fuse(rows, {
      keys: ["name"],
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
        `[Clients Search] Query: "${deferredQuery}" | Results: ${results.length} | Time: ${searchTime.toFixed(2)}ms`,
      );
      return results.map((result) => result.item);
    }
    return rows;
  }, [rows, deferredQuery, fuse]);

  return (
    <div className="container mx-auto py-6 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos clients et consultez leur historique.
          </p>
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
        {filteredRows.length} client{filteredRows.length !== 1 ? "s" : ""}
        {deferredQuery.trim() && ` (recherche: "${deferredQuery}")`}
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

      {filteredRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucun client trouvé</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {deferredQuery.trim()
              ? `Aucun client ne correspond à "${deferredQuery}"`
              : "Aucun client disponible"}
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
