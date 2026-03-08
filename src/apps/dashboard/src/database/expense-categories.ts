import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection, eq } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";
import { idbGet, idbRefresh } from "@/lib/idb";
import type { Id } from "api/data-model";

export type ExpenseCategory = {
  _id: Id<"expenseCategories">;
  _creationTime: number;
  storeId: Id<"stores">;
  name: string;
  lastUpdate?: number;
  deleted?: boolean;
};

export const expenseCategoriesCollection = createCollection(
  queryCollectionOptions({
    queryKey: () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      return ["expenseCategories", storeId];
    },
    queryFn: async (): Promise<any[]> => {
      console.log("[expenseCategories] queryFn running");
      const storeId = useAppStore.getState().selectedStore?._id;
      if (!storeId) return [];

      try {
        const categories = await convex.query(api.expenses.listCategories, {
          storeId,
        });

        await idbRefresh("expenseCategories", categories, storeId);
        return categories;
      } catch (e) {
        const cachedExpenseCategories = await idbGet<ExpenseCategory[]>(
          "expenseCategories",
          storeId,
        );
        return cachedExpenseCategories || [];
      }
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
    staleTime: 0,
  }),
);

export const useGetExpenseCategories = (storeId?: string) => {
  const currentStoreId = useAppStore((state) => state.selectedStore?._id);
  const effectiveStoreId = storeId ?? currentStoreId;
  return useLiveQuery((q) =>
    q
      .from({ expenseCategories: expenseCategoriesCollection })
      .where(({ expenseCategories }) =>
        eq(expenseCategories.storeId, effectiveStoreId),
      ),
  );
};
