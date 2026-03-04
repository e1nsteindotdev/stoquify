import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection, eq } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";
import { idbGet, idbRefresh } from "@/lib/idb";

export const expenseCategoriesCollection = createCollection(
  queryCollectionOptions({
    queryKey: () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      return ["expenseCategories", storeId];
    },
    queryFn: async (): Promise<any[]> => {
      const storeId = useAppStore.getState().selectedStore?._id;
      if (!storeId) return [];
      try {
        const categories = await convex.query(
          api.expenseCategories.listExpenseCategories,
          { storeId },
        );
        idbRefresh("expenseCategories", categories);
        return categories;
      } catch (e) {
        const cachedExpenseCategories = await idbGet("expenseCategories");
        return Array.isArray(cachedExpenseCategories)
          ? cachedExpenseCategories
          : [];
      }
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
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
