import { convex } from "@/lib/convex-client";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { api } from "api/convex";
import { createCollection, eq } from "@tanstack/db";
import { useLiveQuery } from "@tanstack/react-db";
import { queryClient } from "@/lib/ts-query-client";
import { useAppStore } from "@/lib/store";
import { idbGet, idbRefresh } from "@/lib/idb";
import type { Id } from "api/data-model";

export const expensesCollection = createCollection(
  queryCollectionOptions({
    queryKey: () => {
      const storeId = useAppStore.getState().selectedStore?._id;
      return ["expenses", storeId];
    },
    queryFn: async (): Promise<any[]> => {
      const storeId = useAppStore.getState().selectedStore?._id;
      if (!storeId) return [];
      try {
        const expenses = await convex.query(api.expenses.listExpenses, {
          storeId,
        });
        idbRefresh("expenses", expenses);
        return expenses;
      } catch (e) {
        const cachedExpenses = await idbGet("expenses");
        return Array.isArray(cachedExpenses) ? cachedExpenses : [];
      }
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

export const useGetExpenseById = (id: Id<"expenses">) => {
  const { data: expense } = useLiveQuery((q) =>
    q
      .from({ expenses: expensesCollection })
      .where(({ expenses }) => eq(expenses._id, id))
      .findOne(),
  );
  return expense as ExpenseWithCategory | undefined;
};

export type ExpenseWithCategory = NonNullable<
  ReturnType<typeof useGetExpenses>["data"]
>[number];
