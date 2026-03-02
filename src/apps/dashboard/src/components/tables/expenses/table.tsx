import { useState, useMemo, useDeferredValue } from "react";
import { columns } from "./columns";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipLoader } from "react-spinners";
import { convex } from "@/lib/convex-client";
import { api } from "api/convex";
import { useGetExpenses, expensesCollection } from "@/database/expenses";
import { useAppStore } from "@/lib/store";
import { ExpenseFormModal } from "@/components/forms/expense/expense-form-modal";
import { Search, X, Loader2, Plus } from "lucide-react";
import Fuse from "fuse.js";
import { useDebounce } from "use-debounce";

export function ExpensesTable() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 150);

  const storeId = useAppStore((state) => state.selectedStore?._id);
  const expensesResult = useGetExpenses(storeId);
  const expenses = expensesResult?.data ?? [];

  const deferredQuery = useDeferredValue(debouncedQuery);
  const isSearchStale = searchQuery !== deferredQuery;

  const fuse = useMemo(() => {
    return new Fuse(expenses, {
      keys: ["title", "description"],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (deferredQuery.trim()) {
      const results = fuse.search(deferredQuery);
      return results.map((result) => result.item);
    }
    return expenses;
  }, [expenses, deferredQuery, fuse]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.cost, 0);
  }, [filteredExpenses]);

  const onClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const button = target.closest(
      "button[data-expense-id]",
    ) as HTMLButtonElement | null;
    if (button) {
      const id = button.getAttribute("data-expense-id") as any;
      await convex.mutation(api.expenses.deleteExpense, { id });
      await expensesCollection.preload();
    }
  };

  const isLoading = !expensesResult?.data;

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
          <h1 className="text-2xl font-bold tracking-tight">Dépenses</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos dépenses et suivez vos coûts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Nouvelle dépense
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher une dépense..."
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
        {filteredExpenses.length} dépense
        {filteredExpenses.length !== 1 ? "s" : ""}
        {deferredQuery.trim() && ` (recherche: "${deferredQuery}")`}
        {" • "}
        Total:{" "}
        <span className="font-medium text-red-600">
          -{totalExpenses.toLocaleString("fr-FR")} DZD
        </span>
      </div>

      {filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune dépense trouvée</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {deferredQuery.trim()
              ? `Aucune dépense ne correspond à "${deferredQuery}"`
              : "Commencez par ajouter votre première dépense"}
          </p>
          {deferredQuery.trim() ? (
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Effacer la recherche
            </Button>
          ) : (
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Ajouter une dépense
            </Button>
          )}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredExpenses} />
      )}

      <ExpenseFormModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
