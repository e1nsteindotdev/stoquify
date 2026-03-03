import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection, eq } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";

export const expensesCollection = createCollection(
  queryCollectionOptions({
    queryKey: () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      return ["expenses", storeId];
    },
    queryFn: async () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      if (!storeId) return [];
      const expenses = await convex.query(api.expenses.listExpenses, {
        storeId,
      });
      return expenses;
    },
    queryClient,
    getKey: (item) => item._id,
    syncMode: "eager",
  }),
);

export const useGetExpenses = (storeId?: string) => {
  const currentStoreId = useAppStore((state) => state.selectedStore?._id);
  const effectiveStoreId = storeId ?? currentStoreId;
  return useLiveQuery((q) =>
    q
      .from({ expenses: expensesCollection })
      .where(({ expenses }) => eq(expenses.storeId, effectiveStoreId)),
  );
};

export type ExpenseWithCategory = NonNullable<
  ReturnType<typeof useGetExpenses>["data"]
>[number];
